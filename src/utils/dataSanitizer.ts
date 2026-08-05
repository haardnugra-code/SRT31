import {
  Student,
  Violation,
  Counseling,
  Leave,
  DailyJournal,
  MedicalRecord,
  PrayerAttendance,
  ReportCardData
} from '../types';

export interface ShadowDataAuditStats {
  fixedNamesCount: number;
  fixedClassDormCount: number;
  duplicateStudentsRemoved: number;
  duplicateRecordsRemoved: number;
  orphanedRecordsRemoved: number;
  totalRecordsChecked: number;
}

export interface ReconciliationResult {
  students: Student[];
  violations: Violation[];
  counseling: Counseling[];
  leaves: Leave[];
  dailyJournals: DailyJournal[];
  medicalRecords: MedicalRecord[];
  prayerAttendance: PrayerAttendance[];
  reports: Record<string, ReportCardData>;
  stats: ShadowDataAuditStats;
}

/**
 * Reconciles and sanitizes all application entities against the Master Student database.
 * Prevents "Shadow Data" (mismatched student names, orphaned entries, duplicate records, stale dorm/class info).
 */
export function reconcileAndSanitizeShadowData(
  studentsInput: Student[],
  violationsInput: Violation[],
  counselingInput: Counseling[],
  leavesInput: Leave[],
  dailyJournalsInput: DailyJournal[],
  medicalRecordsInput: MedicalRecord[],
  prayerAttendanceInput: PrayerAttendance[],
  reportsInput: Record<string, ReportCardData>,
  purgeOrphans: boolean = true
): ReconciliationResult {
  const stats: ShadowDataAuditStats = {
    fixedNamesCount: 0,
    fixedClassDormCount: 0,
    duplicateStudentsRemoved: 0,
    duplicateRecordsRemoved: 0,
    orphanedRecordsRemoved: 0,
    totalRecordsChecked: 0
  };

  // Helper to detect table header rows accidentally sent from Sheets
  const isHeaderRow = (idStr: string, nameStr: string): boolean => {
    const normId = idStr.toLowerCase().trim();
    const normName = nameStr.toLowerCase().trim();
    const headerKeywords = [
      'nisn/id', 'nisn', 'id', 'no', 'nis', 'nipd', 'no.', 'id siswa',
      'nama lengkap', 'nama siswa', 'nama murid', 'nama', 'name', 'siswa/i', 'siswa'
    ];
    return headerKeywords.includes(normId) || headerKeywords.includes(normName);
  };

  // 1. DEDUPLICATE & CLEAN MASTER STUDENTS
  const studentMap = new Map<string, Student>(); // key: normalized student ID
  const studentNameMap = new Map<string, Student>(); // key: lowercase student name

  const cleanedStudents: Student[] = [];
  studentsInput.forEach((s, idx) => {
    if (!s) return;
    let cleanName = String(s.name || '').trim();
    let cleanId = String(s.id || '').trim();

    // Ignore header rows
    if (isHeaderRow(cleanId, cleanName)) return;

    // Auto-fix missing ID or Name
    if (!cleanId && cleanName) {
      cleanId = `SR-${String(idx + 1).padStart(4, '0')}`;
    }
    if (!cleanName && cleanId) {
      cleanName = `Siswa ${cleanId}`;
    }
    if (!cleanId && !cleanName) return;

    let normKey = cleanId.toLowerCase();

    if (studentMap.has(normKey)) {
      const existing = studentMap.get(normKey)!;
      // If exact same student name, merge details
      if (existing.name.toLowerCase() === cleanName.toLowerCase()) {
        stats.duplicateStudentsRemoved++;
        if (!existing.rfidTag && s.rfidTag) existing.rfidTag = String(s.rfidTag).trim();
        if (!existing.height && s.height) existing.height = s.height;
        if (!existing.weight && s.weight) existing.weight = s.weight;
        if (!existing.shirtSize && s.shirtSize) existing.shirtSize = s.shirtSize;
        if (!existing.pantsSize && s.pantsSize) existing.pantsSize = s.pantsSize;
      } else {
        // Different student sharing the same ID! Assign unique auto-ID to avoid losing student
        cleanId = `${cleanId}_${idx + 1}`;
        normKey = cleanId.toLowerCase();
        const studentObj: Student = {
          ...s,
          id: cleanId,
          name: cleanName,
          class: s.class || 'SD',
          dorm: s.dorm || 'Asrama Dewantara',
          caretaker: s.caretaker ? String(s.caretaker).trim() : '',
          rfidTag: s.rfidTag ? String(s.rfidTag).trim() : undefined
        };
        studentMap.set(normKey, studentObj);
        studentNameMap.set(cleanName.toLowerCase(), studentObj);
        cleanedStudents.push(studentObj);
      }
    } else {
      const studentObj: Student = {
        ...s,
        id: cleanId,
        name: cleanName,
        class: s.class || 'SD',
        dorm: s.dorm || 'Asrama Dewantara',
        caretaker: s.caretaker ? String(s.caretaker).trim() : '',
        rfidTag: s.rfidTag ? String(s.rfidTag).trim() : undefined
      };
      studentMap.set(normKey, studentObj);
      studentNameMap.set(cleanName.toLowerCase(), studentObj);
      cleanedStudents.push(studentObj);
    }
  });

  const validStudentIds = new Set(studentMap.keys());

  // Helper resolver to match student by ID or name
  const resolveStudent = (studentId?: string, studentName?: string): Student | null => {
    if (studentId) {
      const sId = String(studentId).trim().toLowerCase();
      if (studentMap.has(sId)) return studentMap.get(sId)!;
    }
    if (studentName) {
      const sName = String(studentName).trim().toLowerCase();
      if (studentNameMap.has(sName)) return studentNameMap.get(sName)!;
    }
    return null;
  };

  // 2. RECONCILE VIOLATIONS
  const violationSeen = new Set<string>();
  const sanitizedViolations: Violation[] = [];
  violationsInput.forEach((v) => {
    stats.totalRecordsChecked++;
    if (!v) return;
    const vId = v.id ? String(v.id).trim() : `VIO-${Date.now()}-${Math.random()}`;
    if (violationSeen.has(vId)) {
      stats.duplicateRecordsRemoved++;
      return;
    }

    const matchedStudent = resolveStudent(v.studentId, v.studentName);
    if (!matchedStudent) {
      if (purgeOrphans) {
        stats.orphanedRecordsRemoved++;
        return;
      }
      sanitizedViolations.push({
        ...v,
        id: vId,
        studentId: v.studentId ? String(v.studentId).trim() : 'UNKNOWN',
        studentName: v.studentName ? String(v.studentName).trim() : 'Murid Tidak Dikenal'
      });
    } else {
      violationSeen.add(vId);
      if (v.studentName !== matchedStudent.name || v.studentId !== matchedStudent.id) {
        stats.fixedNamesCount++;
      }
      sanitizedViolations.push({
        ...v,
        id: vId,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name
      });
    }
  });

  // 3. RECONCILE COUNSELING
  const counselingSeen = new Set<string>();
  const sanitizedCounseling: Counseling[] = [];
  counselingInput.forEach((c) => {
    stats.totalRecordsChecked++;
    if (!c) return;
    const cId = c.id ? String(c.id).trim() : `CNS-${Date.now()}-${Math.random()}`;
    if (counselingSeen.has(cId)) {
      stats.duplicateRecordsRemoved++;
      return;
    }

    const matchedStudent = resolveStudent(c.studentId, c.studentName);
    if (!matchedStudent) {
      if (purgeOrphans) {
        stats.orphanedRecordsRemoved++;
        return;
      }
      sanitizedCounseling.push({
        ...c,
        id: cId,
        studentId: c.studentId ? String(c.studentId).trim() : 'UNKNOWN',
        studentName: c.studentName ? String(c.studentName).trim() : 'Murid Tidak Dikenal'
      });
    } else {
      counselingSeen.add(cId);
      if (c.studentName !== matchedStudent.name || c.studentId !== matchedStudent.id) {
        stats.fixedNamesCount++;
      }
      sanitizedCounseling.push({
        ...c,
        id: cId,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name
      });
    }
  });

  // 4. RECONCILE LEAVES
  const leaveSeen = new Set<string>();
  const sanitizedLeaves: Leave[] = [];
  leavesInput.forEach((l) => {
    stats.totalRecordsChecked++;
    if (!l) return;
    const lId = l.id ? String(l.id).trim() : `LV-${Date.now()}-${Math.random()}`;
    if (leaveSeen.has(lId)) {
      stats.duplicateRecordsRemoved++;
      return;
    }

    const matchedStudent = resolveStudent(l.studentId, l.studentName);
    if (!matchedStudent) {
      if (purgeOrphans) {
        stats.orphanedRecordsRemoved++;
        return;
      }
      sanitizedLeaves.push({
        ...l,
        id: lId,
        studentId: l.studentId ? String(l.studentId).trim() : 'UNKNOWN',
        studentName: l.studentName ? String(l.studentName).trim() : 'Murid Tidak Dikenal'
      });
    } else {
      leaveSeen.add(lId);
      if (l.studentName !== matchedStudent.name || l.studentId !== matchedStudent.id) {
        stats.fixedNamesCount++;
      }
      sanitizedLeaves.push({
        ...l,
        id: lId,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name
      });
    }
  });

  // 5. RECONCILE DAILY JOURNALS
  const journalSeen = new Set<string>();
  const sanitizedDailyJournals: DailyJournal[] = [];
  dailyJournalsInput.forEach((j) => {
    stats.totalRecordsChecked++;
    if (!j) return;
    const jId = j.id ? String(j.id).trim() : `JRN-${Date.now()}-${Math.random()}`;
    if (journalSeen.has(jId)) {
      stats.duplicateRecordsRemoved++;
      return;
    }

    const matchedStudent = resolveStudent(j.studentId, j.studentName);
    if (!matchedStudent) {
      if (purgeOrphans) {
        stats.orphanedRecordsRemoved++;
        return;
      }
      sanitizedDailyJournals.push({
        ...j,
        id: jId,
        studentId: j.studentId ? String(j.studentId).trim() : 'UNKNOWN',
        studentName: j.studentName ? String(j.studentName).trim() : 'Murid Tidak Dikenal'
      });
    } else {
      journalSeen.add(jId);
      if (j.studentName !== matchedStudent.name || j.studentId !== matchedStudent.id) {
        stats.fixedNamesCount++;
      }
      sanitizedDailyJournals.push({
        ...j,
        id: jId,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name
      });
    }
  });

  // 6. RECONCILE MEDICAL RECORDS
  const medicalSeen = new Set<string>();
  const sanitizedMedicalRecords: MedicalRecord[] = [];
  medicalRecordsInput.forEach((m) => {
    stats.totalRecordsChecked++;
    if (!m) return;
    const mId = m.id ? String(m.id).trim() : `MED-${Date.now()}-${Math.random()}`;
    if (medicalSeen.has(mId)) {
      stats.duplicateRecordsRemoved++;
      return;
    }

    const matchedStudent = resolveStudent(m.studentId, m.studentName);
    if (!matchedStudent) {
      if (purgeOrphans) {
        stats.orphanedRecordsRemoved++;
        return;
      }
      sanitizedMedicalRecords.push({
        ...m,
        id: mId,
        studentId: m.studentId ? String(m.studentId).trim() : 'UNKNOWN',
        studentName: m.studentName ? String(m.studentName).trim() : 'Murid Tidak Dikenal'
      });
    } else {
      medicalSeen.add(mId);
      if (m.studentName !== matchedStudent.name || m.studentId !== matchedStudent.id) {
        stats.fixedNamesCount++;
      }
      sanitizedMedicalRecords.push({
        ...m,
        id: mId,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name
      });
    }
  });

  // 7. RECONCILE PRAYER ATTENDANCE (With Class & Dorm Alignment + Unique Day/Prayer Key)
  const prayerSeen = new Set<string>();
  const sanitizedPrayerAttendance: PrayerAttendance[] = [];
  prayerAttendanceInput.forEach((p) => {
    stats.totalRecordsChecked++;
    if (!p) return;
    const pId = p.id ? String(p.id).trim() : `PA-${Date.now()}-${Math.random()}`;
    // Deduplicate by ID or unique combination (studentId + date + prayerTime)
    const pComboKey = `${p.studentId || ''}_${p.date || ''}_${p.prayerTime || ''}`;

    if (prayerSeen.has(pId) || (p.studentId && p.date && p.prayerTime && prayerSeen.has(pComboKey))) {
      stats.duplicateRecordsRemoved++;
      return;
    }

    const matchedStudent = resolveStudent(p.studentId, p.studentName);
    if (!matchedStudent) {
      if (purgeOrphans) {
        stats.orphanedRecordsRemoved++;
        return;
      }
      sanitizedPrayerAttendance.push({
        ...p,
        id: pId,
        studentId: p.studentId ? String(p.studentId).trim() : 'UNKNOWN',
        studentName: p.studentName ? String(p.studentName).trim() : 'Murid Tidak Dikenal'
      });
    } else {
      prayerSeen.add(pId);
      if (p.studentId && p.date && p.prayerTime) prayerSeen.add(pComboKey);

      if (p.studentName !== matchedStudent.name || p.studentId !== matchedStudent.id) {
        stats.fixedNamesCount++;
      }
      if (p.class !== matchedStudent.class || p.dorm !== matchedStudent.dorm) {
        stats.fixedClassDormCount++;
      }

      sanitizedPrayerAttendance.push({
        ...p,
        id: pId,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        class: matchedStudent.class,
        dorm: matchedStudent.dorm
      });
    }
  });

  // 8. RECONCILE REPORTS (Report Cards)
  const sanitizedReports: Record<string, ReportCardData> = {};
  Object.entries(reportsInput).forEach(([key, rep]) => {
    stats.totalRecordsChecked++;
    const matchedStudent = resolveStudent(key);
    if (matchedStudent) {
      sanitizedReports[matchedStudent.id] = rep;
    } else if (!purgeOrphans) {
      sanitizedReports[key] = rep;
    } else {
      stats.orphanedRecordsRemoved++;
    }
  });

  return {
    students: cleanedStudents,
    violations: sanitizedViolations,
    counseling: sanitizedCounseling,
    leaves: sanitizedLeaves,
    dailyJournals: sanitizedDailyJournals,
    medicalRecords: sanitizedMedicalRecords,
    prayerAttendance: sanitizedPrayerAttendance,
    reports: sanitizedReports,
    stats
  };
}
