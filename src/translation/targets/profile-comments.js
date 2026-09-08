import { registerTarget } from './index.js';

registerTarget({
  id: 'profileComments',
  labelKey: 'scope.profileComments',
  // Comment threads in profiles, hubs and shared files.
  selector: '.commentthread_comment_text',
});
