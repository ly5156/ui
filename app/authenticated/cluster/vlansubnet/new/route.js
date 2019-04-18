import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  scope: service(),
  model() {
    const clusterId = get(this, 'scope.currentCluster.id');

    return { clusterId };
  },
});
