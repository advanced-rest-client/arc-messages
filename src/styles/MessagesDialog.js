import { css } from 'lit-element';

export default css `
:host {
  display: block;
  max-width: 80%;
}

a {
  color: var(--link-color);
}

.message {
  margin: 12px 0;
  padding: 12px 0 20px 0;
  border-bottom: 1px #e5e5e5 solid;
}

.time {
  margin: 0;
  color: var(--secondary-text-color, rgba(0, 0, 0, 0.74));
  font-size: 0.94rem;
}
`;
