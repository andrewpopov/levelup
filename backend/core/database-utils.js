/**
 * Database utility functions for promise-based async/await support
 * Wraps sqlite3 callback-based API with Promises
 */

export function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

export function dbSerialize(db, callback) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        const result = callback();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}
