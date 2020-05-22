import Route from '@ember/routing/route';
import { get, } from '@ember/object';

export default Route.extend({
  model(params) {
    return { url: decodeURIComponent(get(params, 'url')) };
  },
});