const locks = new Map();

function acquireLock(shopId) {
  return new Promise((resolve) => {
    const tryLock = () => {
      if (!locks.has(shopId)) {
        console.log(`[LOCK ACQUIRED] shopId: ${shopId}`);
        locks.set(shopId, true);
        resolve();
      } else {
        console.log(`[LOCK WAITING] shopId: ${shopId}`);
        setTimeout(tryLock, 100); // Wait and retry
      }
    };
    tryLock();
  });
}

function releaseLock(shopId) {
  console.log(`[LOCK RELEASED] shopId: ${shopId}`);
  locks.delete(shopId);
}

module.exports = { acquireLock, releaseLock };
