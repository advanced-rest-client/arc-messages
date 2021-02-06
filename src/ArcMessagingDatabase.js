/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */

const DB_VERSION = 1;
const DB_NAME = 'arc-messages';
const DB_OPENS = Symbol('DB_OPENS');
const STORE_NAMES = ['messages', 'meta'];

const MIGRATIONS = [
  /** 
   * @param {IDBDatabase} database
   */
  (database) => {
    const msgs = database.createObjectStore(STORE_NAMES[0], {
      keyPath: 'key',
    });
    msgs.createIndex('time', 'time', { unique: true });
    msgs.createIndex('read', 'read', { unique: false });
    database.createObjectStore(STORE_NAMES[1]);
  }
];

/**
 * A service that runs in the renderer process and downloads the in-app messages from the developer to the users.
 * It synchronizes the messages with the internal data store.
 */
export class ArcMessagingDatabase {
  constructor() {
    /**
     * @type {Promise<IDBDatabase>}
     */
    this[DB_OPENS] = undefined;
  }

  /**
   * Opens the datastore.
   *
   * @returns {Promise<IDBDatabase>} Promise resolved when the datastore is opened.
   */
  openDb() {
    if (!this[DB_OPENS]) {
      this[DB_OPENS] = /** @type Promise<IDBDatabase> */ (new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const db = request.result;
          for (let i = event.oldVersion; i < event.newVersion; ++i) {
            MIGRATIONS[i].call(this, db);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }));
    }
    return this[DB_OPENS];
  }

  /**
   * Closes active connection to the datastore.
   *
   * @return {Promise<void>}
   */
  async closeDb() {
    if (this[DB_OPENS] === null) {
      return;
    }
    const db = await this.openDb()
    this[DB_OPENS] = null;
    db.close();
  }

  /**
   * Perform a transaction on an IndexedDB object store.
   *
   * @param {string} operation The name of the method to call on the object
   * store instance.
   * @param {string} storeName The name of the object store to operate on.
   * @param {IDBTransactionMode} mode The mode of the transaction that will be performed.
   * @param {...*} operationArgs The arguments to call the method named by
   * the operation parameter.
   * @returns {Promise<any>} A promise that resolves when the transaction completes,
   * with the result of the transaction, or rejects if the transaction fails
   * with the error reported by the transaction.
   */
  async operateOnStore(operation, storeName, mode, ...operationArgs) {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      let transaction = /** @type IDBTransaction */ (null);
      let request;
      try {
        transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        /* eslint-disable-next-line */
        request = store[operation].apply(store, operationArgs);
      } catch (e) {
        reject(e);
        return;
      }
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  /**
   * Lists keys in the datastore.
   *
   * @param {'meta'|'data'} type Type name
   * @returns {Promise<IDBValidKey[]>}
   */
  async keysFor(type) {
    const name = this.storeName(type);
    if (!name) {
      throw new Error(`Type not supported: ${type}`);
    }
    return this.listKeys(name);
  }
  
  /**
   * Lists keys in the data store.
   *
   * @param {string} storeName Name of the data store.
   * @returns {Promise<IDBValidKey[]>}
   */
  async listKeys(storeName) {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      let transaction = /** @type IDBTransaction */ (null);
      const keys = [];
      try {
        transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.openKeyCursor();
        request.onsuccess = (event) => {
          const cursor = /** @type IDBRequest<IDBCursor> */ (event.target).result;
          if (cursor) {
            keys.push(cursor.key);
            cursor.continue();
          }
        };
      } catch (e) {
        reject(e);
        return;
      }
      transaction.oncomplete = () => resolve(keys);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  /**
   * Lists data for given type and index.
   *
   * @param {'meta'|'data'} type Entity type
   * @param {string=} index Index name
   * @param {string|number=} value Index value
   * @returns {Promise<any[]>}
   */
  async dataForIndex(type, index, value) {
    const name = this.storeName(type);
    if (!name) {
      throw new Error(`Type not supported: ${type}`);
    }
    return this.listObjects(name, index, value);
  }

  /**
   * Lists data for given type and index.
   *
   * @param {string} storeName Store name
   * @param {string=} index Index name
   * @param {string|number=} value Index value
   * @returns {Promise<any>}
   */
  async listObjects(storeName, index, value) {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      let transaction = /** @type IDBTransaction */ (null);
      const values = [];
      try {
        transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        let cursorSource = /** @type IDBIndex|IDBObjectStore */ (null);
        let range = /** @type IDBKeyRange */ (null);
        if (index) {
          cursorSource = store.index(index);
          range = IDBKeyRange.only(value);
        } else {
          cursorSource = store;
        }
        const request = cursorSource.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = /** @type IDBRequest<IDBCursorWithValue> */ (event.target).result;
          if (cursor) {
            values.push(cursor.value);
            cursor.continue();
          }
        };
      } catch (e) {
        reject(e);
        return;
      }
      transaction.oncomplete = () => resolve(values);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  /**
   * Perform a "get" operation on an IndexedDB object store.
   *
   * @param {string} storeName The name of the object store to operate on.
   * @param {string} key The key in the object store that corresponds to the value that should be got.
   * @returns {Promise<any>} A promise that resolves with the outcome of the operation.
   */
  get(storeName, key) {
    return this.operateOnStore('get', storeName, 'readonly', key);
  }

  /**
   * Perform a "put" operation on an IndexedDB object store.
   *
   * @param {string} storeName The name of the object store to operate on.
   * @param {string} key The key in the object store that corresponds to the value that should be put.
   * @param {any} value The value to be put in the object store at the given key.
   * @returns {Promise<void>} A promise that resolves with the outcome of the operation.
   */
  set(storeName, key, value) {
    return this.operateOnStore('put', storeName, 'readwrite', value, key);
  }

  /**
   * Perform a "clear" operation on an IndexedDB object store.
   *
   * @param {string} storeName The name of the object store to operate on.
   * @return {Promise<void>} A promise that resolves with the outcome of the operation.
   */
  clear(storeName) {
    return this.operateOnStore('clear', storeName, 'readwrite');
  }

  /**
   * Performs a transaction (in the parlance of the the client).
   *
   * @param {string} method The method of the transaction. Supported methods are `"get"` and `"set"`.
   * @param {'meta'|'data'} type Data type. Can be either `meta` or `data`.
   * @param {string} key The key to get or set.
   * @param {any} value The value to set, when the method is `"set"`.
   * @return {Promise} A promise that resolves with the outcome of the transaction, or rejects if an unsupported method is attempted.
   */
  async transaction(method, type, key, value=null) {
    const store = this.storeName(type);
    if (!store) {
      throw new Error(`Type not supported: ${type}`);
    }
    switch (method) {
      case 'get':
        return this.get(store, key);
      case 'set':
        return this.set(store, key, value);
      case 'set-all':
        return this.bulkSet(store, value);
      default:
        throw new Error(`Method not supported: ${  method}`);
    }
  }

  /**
   * Adds many records to the data store in single transaction.
   *
   * @param {string} storeName Data store name
   * @param {any[]} values List of objects to put into the store
   * @returns {Promise<void>} Promise resolved when operation is completed.
   */
  async bulkSet(storeName, values) {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      let transaction = /** @type IDBTransaction */ (null);
      try {
        transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        values.forEach((obj) => {
          if (!obj.key) {
            obj.key = obj.id;
          }
          store.put(obj);
        });
      } catch (e) {
        reject(e);
        return;
      }
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
  }

  /**
   * Returns a store name for given data type.
   * @param {'meta'|'data'} type Data type. Can be either `meta` or `data`.
   * @returns {string|undefined} Store name for data type.
   */
  storeName(type) {
    let store;
    switch (type) {
      case 'meta':
        store = STORE_NAMES[1];
        break;
      case 'data':
        store = STORE_NAMES[0];
        break;
      default:
    }
    return store;
  }
}
