import type { App, DirectiveBinding } from 'vue';
import { globalAbility, type Action } from '@/core/permissions/ability';

export const canDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const action = binding.arg as Action;
    const subject = binding.value;

    const allowed = globalAbility.can(action, subject);
    if (!allowed) {
      el.parentNode?.removeChild(el);
    }
  },
};

export function registerPermissions(app: App) {
  app.directive('can', canDirective);
}
