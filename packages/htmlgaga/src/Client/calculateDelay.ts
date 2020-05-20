export default function calculateDelay(delay = 200, retries = 0): number {
  return delay * Math.pow(2, retries)
}
