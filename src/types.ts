export type Detection = {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: number[];
  track_id: number | null;
  counted_as_new: boolean;
};

export type CountSummary = {
  session_id: string;
  total_unique: number;
  by_class: Record<string, number>;
  processed_frames: number;
  last_frame_total: number;
  last_frame_new: number;
};

export type DetectionResponse = {
  filename: string;
  image_width: number;
  image_height: number;
  inference_ms: number;
  device: string;
  detections: Detection[];
  annotated_image_base64: string | null;
  counts?: CountSummary;
};
