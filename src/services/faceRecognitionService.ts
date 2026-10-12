import * as faceapi from '@vladmandic/face-api';
import { Student } from '../types';

let modelsLoaded = false;
let modelsLoadingPromise: Promise<boolean> | null = null;

// Fallback CDN if local static files encounter any fetch issues
const LOCAL_MODEL_PATH = '/models';
const CDN_MODEL_PATH = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

/**
 * Load face-api models (TinyFaceDetector, FaceLandmark68TinyNet, FaceRecognitionNet)
 */
export async function loadFaceRecognitionModels(): Promise<boolean> {
  if (modelsLoaded) return true;
  if (modelsLoadingPromise) return modelsLoadingPromise;

  modelsLoadingPromise = (async () => {
    try {
      // First attempt: local /models
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(LOCAL_MODEL_PATH),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(LOCAL_MODEL_PATH),
          faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_MODEL_PATH),
        ]);
        modelsLoaded = true;
        console.log('[FaceRecognition] Models loaded successfully from local /models');
        return true;
      } catch (localErr) {
        console.warn('[FaceRecognition] Local model load failed, falling back to CDN...', localErr);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CDN_MODEL_PATH),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(CDN_MODEL_PATH),
          faceapi.nets.faceRecognitionNet.loadFromUri(CDN_MODEL_PATH),
        ]);
        modelsLoaded = true;
        console.log('[FaceRecognition] Models loaded successfully from CDN');
        return true;
      }
    } catch (err) {
      console.error('[FaceRecognition] Failed to load models:', err);
      modelsLoaded = false;
      return false;
    } finally {
      modelsLoadingPromise = null;
    }
  })();

  return modelsLoadingPromise;
}

export function isFaceModelsLoaded(): boolean {
  return modelsLoaded;
}

export interface DetectedFaceResult {
  descriptor: Float32Array;
  detection: {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    score: number;
  };
  landmarks?: any;
}

/**
 * Extract face descriptor from an image element, video, or canvas
 */
export async function extractSingleFaceDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<DetectedFaceResult | null> {
  const isLoaded = await loadFaceRecognitionModels();
  if (!isLoaded) return null;

  try {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    const detection = await faceapi
      .detectSingleFace(input, options)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) return null;

    return {
      descriptor: detection.descriptor,
      detection: {
        box: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height,
        },
        score: detection.detection.score,
      },
      landmarks: detection.landmarks,
    };
  } catch (err) {
    console.error('[FaceRecognition] Error extracting face descriptor:', err);
    return null;
  }
}

/**
 * Detect all faces in video frame with descriptors
 */
export async function detectAllFacesInFrame(
  video: HTMLVideoElement
): Promise<DetectedFaceResult[]> {
  const isLoaded = await loadFaceRecognitionModels();
  if (!isLoaded) return [];

  try {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 });
    const detections = await faceapi
      .detectAllFaces(video, options)
      .withFaceLandmarks(true)
      .withFaceDescriptors();

    return detections.map((d) => ({
      descriptor: d.descriptor,
      detection: {
        box: {
          x: d.detection.box.x,
          y: d.detection.box.y,
          width: d.detection.box.width,
          height: d.detection.box.height,
        },
        score: d.detection.score,
      },
      landmarks: d.landmarks,
    }));
  } catch (err) {
    console.error('[FaceRecognition] Error detecting faces in frame:', err);
    return [];
  }
}

// In-memory cache for registered student descriptors
const descriptorCache = new Map<string, Float32Array>();

export function cacheStudentDescriptor(studentId: string, descriptor: Float32Array | number[]): void {
  const floatArray = descriptor instanceof Float32Array ? descriptor : new Float32Array(descriptor);
  descriptorCache.set(String(studentId).trim(), floatArray);
}

export function getCachedStudentDescriptor(studentId: string): Float32Array | undefined {
  return descriptorCache.get(String(studentId).trim());
}

export function removeCachedStudentDescriptor(studentId: string): void {
  descriptorCache.delete(String(studentId).trim());
}

export function clearDescriptorCache(): void {
  descriptorCache.clear();
}

/**
 * Build a FaceMatcher from student dataset.
 * Automatically uses cached descriptors or student.faceDescriptor if present.
 */
export function buildFaceMatcher(
  students: Student[],
  distanceThreshold = 0.55
): faceapi.FaceMatcher | null {
  const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

  for (const student of students) {
    if (student.faceDisabled) continue;
    const sId = String(student.id).trim();

    let desc = descriptorCache.get(sId);

    if (!desc && student.faceDescriptor && student.faceDescriptor.length === 128) {
      desc = new Float32Array(student.faceDescriptor);
      descriptorCache.set(sId, desc);
    }

    if (desc && student.faceDescriptor && student.faceDescriptor.length === 128) {
      labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(sId, [desc]));
    }
  }

  if (labeledDescriptors.length === 0) {
    return null;
  }

  return new faceapi.FaceMatcher(labeledDescriptors, distanceThreshold);
}

/**
 * Helper to compute Euclidean distance between two 128-d vectors
 */
export function euclideanDistance(a: Float32Array | number[], b: Float32Array | number[]): number {
  return faceapi.euclideanDistance(a, b);
}

/**
 * Convert descriptor distance to a 0-100% confidence percentage
 */
export function distanceToConfidence(distance: number, maxThreshold = 0.6): number {
  if (distance >= maxThreshold) return 0;
  const confidence = Math.round((1 - distance / maxThreshold) * 100);
  return Math.max(0, Math.min(100, confidence));
}
