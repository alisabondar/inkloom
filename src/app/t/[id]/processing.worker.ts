/// <reference lib="webworker" />
import { processAll, type WorkerRequest, type WorkerResponse } from './processing';

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, image, params } = event.data;
  let reply: WorkerResponse;
  try {
    reply = { id, result: processAll(image, params) };
  } catch (err) {
    reply = { id, error: err instanceof Error ? err.message : 'Processing failed' };
  }
  (self as unknown as Worker).postMessage(reply);
};
