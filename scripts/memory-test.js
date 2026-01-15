function logMemory(label = "") {
  const m = process.memoryUsage();
  console.log(
    `[MEM] ${label}`,
    `RSS=${(m.rss / 1024 / 1024).toFixed(1)}MB`,
    `Heap=${(m.heapUsed / 1024 / 1024).toFixed(1)}MB`
  );
}
