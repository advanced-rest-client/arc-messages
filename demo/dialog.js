import { html } from 'lit-html';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@anypoint-web-components/anypoint-switch/anypoint-switch.js';
import { ArcMessagingService } from '../index.js';
import '../arc-messages-dialog.js';

/** @typedef {import('../').ArcAppStoredMessage} ArcAppStoredMessage */

class ComponentPage extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties(['messages', 'unreadCount']);
    this.componentName = 'ARC Messages dialog';
    this.demoStates = ['Material', 'Anypoint'];
    this.renderViewControls = true;
    this.compatibility = false;
    /** 
     * @type {ArcAppStoredMessage[]}
     */
    this.messages = undefined;
    this.unreadCount = 0;
    this.service = new ArcMessagingService('electron', 'stable');

    this.openDialog = this.openDialog.bind(this);
    this.requestMessages = this.requestMessages.bind(this);

    this.requestMessages();
  }

  async requestMessages() {
    this.unreadCount = await this.service.run();
    this.messages = await this.service.readMessages();
    // this.messages = this.messages.concat(this.messages).concat(this.messages).concat(this.messages);
  }

  async openDialog() {
    const dialog = document.querySelector('arc-messages-dialog');
    dialog.opened = true;

    await this.service.markAllRead();
    this.unreadCount = 0;
  }

  _demoTemplate() {
    const {
      messages,
      unreadCount,
      demoStates,
      darkThemeActive,
      compatibility,
    } = this;
    return html`
    <section class="documentation-section">
      <h3>Interactive demo</h3>
      <arc-interactive-demo
        .states="${demoStates}"
        @state-changed="${this._demoStateHandler}"
        ?dark="${darkThemeActive}"
      >
        <anypoint-button slot="content" @click="${this.openDialog}">Open (${unreadCount} unread)</anypoint-button>
      </arc-interactive-demo>
      <arc-messages-dialog
        .messages="${messages}"
        ?compatibility="${compatibility}"
        modal
      ></arc-messages-dialog>
    </section>
    `;
  }


  contentTemplate() {
    return html`
      <h2>ARC messages dialog</h2>
      ${this._demoTemplate()}
    `;
  }
}

const instance = new ComponentPage();
instance.render();
