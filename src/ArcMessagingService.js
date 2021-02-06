/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
import { ArcMessagingDatabase } from './ArcMessagingDatabase.js';

/** @typedef {import('./types').ArcAppMessage} ArcAppMessage */
/** @typedef {import('./types').ArcAppMessagesResponse} ArcAppMessagesResponse */
/** @typedef {import('./types').ArcAppStoredMessage} ArcAppStoredMessage */

export const sync = Symbol('sync');

/**
 * A service that runs in the renderer process and downloads the in-app messages from the developer to the users.
 * It synchronizes the messages with the internal data store.
 */
export class ArcMessagingService {
  /**
   * @param {string} platform The name of the platform this service runs on.
   * @param {string=} [channel='stable'] The release channel of the application.
   */
  constructor(platform, channel = 'stable') {
    /** 
     * The backend application base URI.
     */
    this.endpointUri = 'https://api.advancedrestclient.com/v1/messages';
    /**
     * @type {string} the name of the release channel.
     */
    this.channel = channel;
    /**
     * The name of the platform used by this service.
     * @type {string}
     */
    this.platform = platform;
    /**
     * Handler to the data store operations.
     * @type {ArcMessagingDatabase}
     */
    this.db = new ArcMessagingDatabase();
  }
  
  /**
   * Checks when the messages were downloaded the last time.
   * @returns {Promise<number>} Zero means the messages were never checked.
   */
  async lastChecked() {
    const result = await this.db.transaction('get', 'meta', 'updateTime');
    const typed = Number(result);
    if (!result || Number.isNaN(typed)) {
      return 0;
    }
    return typed;
  }

  /**
   * @param {number} time
   */
  async storeLastChecked(time) {
    await this.db.transaction('set', 'meta', 'updateTime', time);
  }

  /**
   * @returns {Promise<number>} The number of unread messages.
   */
  async run() {
    const timestamp = await this.lastChecked();
    if (timestamp) {
      const now = Date.now();
      // one hour
      if (now - timestamp < 3600000) {
        return this.countUnread();
      }
    }
    const url = this.generateUrl(timestamp);
    const result = await this.getMessages(url.toString());
    if (!result) {
      return this.countUnread();
    }
    if (url.searchParams.has('until')) {
      const until = Number(url.searchParams.get('until'));
      await this.storeLastChecked(until);
    } else {
      await this.storeLastChecked(Date.now());
    }
    return this.sync(result);
  }

  /**
   * @param {number} lastChecked
   * @returns {URL|null} 
   */
  generateUrl(lastChecked) {
    const { platform, channel } = this;
    if (!platform) {
      return null;
    }
    const url = new URL(this.endpointUri);
    url.searchParams.set('platform', platform);
    if (channel) {
      if (channel === 'latest') {
        url.searchParams.set('channel', 'stable');
      } else {
        url.searchParams.set('channel', channel);
      }
    }
    if (lastChecked) {
      url.searchParams.set('since', String(lastChecked));
      url.searchParams.set('until', String(Date.now()));
    }
    return url;
  }

  /**
   * @param {string} url The final URL of the messages query.
   * @returns {Promise<ArcAppMessagesResponse|null>} The response from the server.
   */
  async getMessages(url) {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return response.json();
  }

  /**
   * Synchronizes incoming messages with the datastore.
   *
   * @param {ArcAppMessagesResponse} incomingMessages Response from ARC server.
   * @returns {Promise<number>} The number of unread messages
   */
  async sync(incomingMessages) {
    if (!incomingMessages.items || !incomingMessages.items.length) {
      return this.countUnread();
    }
    const keys = await this.db.keysFor('data');
    return this[sync](incomingMessages.items, keys);
  }

  /**
   * @param {ArcAppMessage[]} incomingMessages
   * @param {IDBValidKey[]} [existingKeys=[]]
   * @returns {Promise<number>} The number of unread messages
   */
  async [sync](incomingMessages, existingKeys=[]) {
    let insert = /** @type ArcAppStoredMessage[] */ ([]);
    if (existingKeys.length === 0) {
      insert = incomingMessages;
    } else {
      insert = incomingMessages.filter((message) => !existingKeys.includes(message.id));
    }
    if (!insert.length) {
      return this.countUnread();
    }
    insert.forEach((message) => { message.read = 0 });
    await this.db.transaction('set-all', 'data', undefined, insert);
    return this.countUnread();
  }

  /**
   * Updates list of unread messages.
   *
   * @returns {Promise<number>} The number of unread messages
   */
  async countUnread() {
    const unread = await this.db.dataForIndex('data', 'read', 0);
    if (!Array.isArray(unread)) {
      return 0;
    }
    return unread.length;
  }

  /**
   * Reads list of all messages from the data store.
   *
   * @returns {Promise<ArcAppStoredMessage[]>}
   */
  async readMessages() {
    const messages = await this.db.dataForIndex('data');
    messages.sort(this._messagesSort);
    return messages;
  }

  /**
   * Sort function for the messages.
   *
   * @param {ArcAppStoredMessage} a
   * @param {ArcAppStoredMessage} b
   * @returns {number}
   */
  _messagesSort(a, b) {
    if (a.time > b.time) {
      return -1;
    }
    if (a.time < b.time) {
      return 1;
    }
    return 0;
  }

  /**
   * Marks a single message as read.
   *
   * Note, this changes the `unread` property.
   *
   * @param {string} key Message key property
   * @returns {Promise<void>}
   */
  async markRead(key) {
    const item = await this.db.transaction('get', 'data', key);
    item.read = 1;
    await this.db.transaction('set', 'data', undefined, item);
  }

  /**
   * Marks all messages are read.
   *
   * @returns {Promise<void>}
   */
  async markAllRead() {
    const unread = await this.db.dataForIndex('data', 'read', 0);
    if (!Array.isArray(unread) || !unread.length) {
      return;
    }

    unread.forEach((item) => { item.read = 1 });
    await this.db.transaction('set-all', 'data', undefined, unread);
  }

  /**
   * Closes datastore connection in shared worker.
   *
   * @returns {Promise<void>}
   */
  async closeDb() {
    await this.db.closeDb();
  }
}
