import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';

export default Route.extend({
  harbor:       service(),
  access:       service(),
  globalStore:  service(),
  prefs:        service(),
  harborServer:       '',
  beforeModel() {
    this._super(...arguments);

    return get(this, 'harbor').loadHarborServerUrl().then((resp) => {
      set(this, 'harborServer', resp);
    });
  },
  model(params) {
    const page = params.page || 1;
    const pageSize = get(this, 'prefs.tablePerPage');

    const p = {
      page,
      page_size: pageSize
    }

    if (params.name) {
      p.username = params.name
    }

    return get(this, 'harbor').fetchProjectLogs( params.project_id, p ).then((resp) => {
      const data = resp.body;

      data.forEach((item) => {
        item.displayName = item.name;
      });

      return {
        data,
        totalCount: parseInt(resp.headers.map['x-total-count'] || 0),
        projectId:  params.project_id
      };
    });
  },
  redirect() {
    if (!get(this, 'access.admin')) {
      this.transitionTo('image-repo.projects.index');
    }
  },
  actions: {
    refreshModel() {
      this.refresh();
    }
  },
  queryParams: {
    page:       { refreshModel: true },
    name:       { refreshModel: true },
  },
});
