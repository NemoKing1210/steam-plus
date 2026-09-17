import { registerTarget } from './index.js';

registerTarget({
  id: 'guides',
  labelKey: 'scope.guides',
  grouped: true,
  // Guide pages (sharedfiles/filedetails): header title scoped to the guide
  // header so other workshop items never match, the top description, and
  // every section title + body. Per-element buttons stay hidden: one master
  // button above the guide translates the whole content at once. Guide
  // comments travel through the existing profileComments scope
  // (.commentthread_comment_text).
  selector:
    '.guideTop .workshopItemTitle, .guideTopDescription, .subSectionTitle, .subSectionDesc',
});
