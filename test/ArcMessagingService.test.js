/* eslint-disable func-names */
/* eslint-disable arrow-body-style */
import { assert, aTimeout } from '@open-wc/testing';
import { ArcMessagingService } from '../index.js';

describe('ArcMessagingService', () => {
  const deleteDatastore = () => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase('arc-messages');
      request.onerror = function() {
        reject(new Error('Error deleting database'));
      };
      request.onsuccess = function() {
        resolve();
      };
      request.onblocked = function() {
        console.log('TRANSACTION BLOCKED. Whatever.');
        resolve();
      };
      request.onupgradeneeded = function() {
        resolve();
      };
    });
  };

  /**
   * @param {ArcMessagingService} service
   * @return {Promise<void>} 
   */
  const clearMessages = async (service) => {
    const db = await service.db.openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readwrite');
      const objectStore = transaction.objectStore('messages');
      const request = objectStore.clear();
      request.onerror = function() {
        reject(new Error('Error clearing messages database'));
      };
      request.onsuccess = function() {
        resolve();
      };
    });
  };

  /**
   * @param {ArcMessagingService} service
   * @return {Promise<void>} 
   */
  const clearMeta = async (service) => {
    const db = await service.db.openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['meta'], 'readwrite');
      const objectStore = transaction.objectStore('meta');
      const request = objectStore.clear();
      request.onerror = function() {
        reject(new Error('Error clearing meta database'));
      };
      request.onsuccess = function() {
        resolve();
      };
    });
  };

  describe('messages processing', () => {
    let instance = /** @type ArcMessagingService */ (null);
    after(async () => {
      if (instance) {
        await instance.closeDb();
      }
      await deleteDatastore();
    });

    beforeEach(async () => {
      instance = new ArcMessagingService('chrome', 'stable');
      instance.endpointUri = new URL('/api/v1/messages', window.location.href).toString();
    });

    afterEach(async () => {
      await clearMessages(instance);
      await clearMeta(instance);
      await instance.closeDb();
      await aTimeout(0);
    });

    it('returns the number of unread messages', async () => {
      const result = await instance.run();
      assert.strictEqual(result, 20);
    });

    it('sets the last run time', async () => {
      await instance.run();
      const result = await instance.lastChecked();
      assert.typeOf(result, 'number');
    });

    it('returns processed messages', async () => {
      await instance.run();
      const messages = await instance.readMessages();
      assert.typeOf(messages, 'array');
      assert.lengthOf(messages, 20);
    });

    it('marks all as read', async () => {
      await instance.run();
      await instance.markAllRead();
      const result = await instance.countUnread();
      assert.strictEqual(result, 0);
    });

    it('marks a message as read', async () => {
      await instance.run();
      const messages = await instance.readMessages();
      const [msg] = messages;
      await instance.markRead(msg.id);
      const result = await instance.countUnread();
      assert.strictEqual(result, 19);
    });
  });
});
