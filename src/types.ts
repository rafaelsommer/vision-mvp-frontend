export type Detection = {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: number[];
};

export type DetectionResponse = {
  filename: string;
  image_width: number;
  image_height: number;
  inference_ms: number;
  device: string;
  detections: Detection[];
  annotated_image_base64: string | null;
};

