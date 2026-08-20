/**
 * High-performance Binary Min-Heap Priority Queue for A* Pathfinding.
 * Operations:
 * - push: O(log N)
 * - pop (extract-min): O(log N)
 * - peek: O(1)
 * - size: O(1)
 */
export class PriorityQueue<T> {
  private heap: Array<{ item: T; priority: number }> = [];

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0].item;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  clear(): void {
    this.heap = [];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = (index - 1) >> 1;
      if (this.heap[index].priority >= this.heap[parentIdx].priority) break;
      this.swap(index, parentIdx);
      index = parentIdx;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    const elementPriority = this.heap[index].priority;

    while (true) {
      const leftChildIdx = (index << 1) + 1;
      const rightChildIdx = leftChildIdx + 1;
      let swapIdx: number | null = null;
      let minPriority = elementPriority;

      if (leftChildIdx < length) {
        const leftPriority = this.heap[leftChildIdx].priority;
        if (leftPriority < minPriority) {
          minPriority = leftPriority;
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        const rightPriority = this.heap[rightChildIdx].priority;
        if (rightPriority < minPriority) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === null) break;
      this.swap(index, swapIdx);
      index = swapIdx;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}
