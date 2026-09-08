import { registerTarget } from './index.js';

registerTarget({
  id: 'gameNews',
  labelKey: 'scope.gameNews',
  // Event/news detail bodies on the store and community hubs.
  selector:
    '.eventspage_content_body, .eventText, .news_event_summary, .blotter_daily_rollup_line .blotter_content',
});
