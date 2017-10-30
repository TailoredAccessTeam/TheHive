(function() {
    'use strict';
    angular.module('theHiveServices').service('DashboardSrv', function(QueryBuilderSrv, localStorageService, $q, AuthenticationSrv, $http) {
        var baseUrl = './api/dashboard';
        var self = this;

        this.metadata = null;

        this.defaultDashboard = {
            items: [
                {
                    type: 'container',
                    items: []
                }
            ]
        };

        this.timeIntervals = [{
            code: '1d',
            label: 'By day'
        }, {
            code: '1w',
            label: 'By week'
        }, {
            code: '1M',
            label: 'By month'
        }, {
            code: '1y',
            label: 'By year'
        }];

        this.aggregations = [{
            id: 'count',
            label: 'count'
        }, {
            id: 'sum',
            label: 'sum'
        }, {
            id: 'min',
            label: 'min'
        }, {
            id: 'max',
            label: 'max'
        }, {
            id: 'avg',
            label: 'avg'
        }];

        this.serieTypes = ['line', 'area', 'spline', 'area-spline', 'bar'];

        this.toolbox = [
            {
                type: 'container',
                items: []
            },
            {
                type: 'bar',
                options: {}
            },
            {
                type: 'line',
                options: {}
            },
            {
                type: 'donut',
                options: {
                    title: null,
                    entity: null,
                    field: null
                }
            }
        ];

        this.renderers = {
            severity: function() {}
        };

        this.create = function(dashboard) {
            return $http.post(baseUrl, dashboard);
        };

        this.update = function(id, dashboard) {
            return $http.patch(baseUrl + '/' + id, dashboard);
        };

        this.list = function() {
            return $http.post(baseUrl + '/_search', {
                range: 'all',
                sort: ['-status', '-updatedAt', '-createdAt'],
                query: {
                    _and: [
                        {
                            _not: { status: 'Deleted' }
                        },
                        {
                            _or: [{ status: 'Shared' }, { createdBy: AuthenticationSrv.currentUser.id }]
                        }
                    ]
                }
            });
        };

        this.get = function(id) {
            return $http.get(baseUrl + '/' + id);
        };

        this.remove = function(id) {
            return $http.delete(baseUrl + '/' + id);
        };

        this._objectifyBy = function(collection, field) {
            var obj = {};

            _.each(collection, function(item) {
                obj[item[field]] = item;
            });

            return obj;
        };

        this.getMetadata = function() {
            var defer = $q.defer();

            if (this.metadata !== null) {
                defer.resolve(this.metadata);
            } else {
                $http
                    .get('./api/describe/_all')
                    .then(function(response) {
                        var data = response.data;
                        var metadata = {
                            entities: _.keys(data).sort()
                        };

                        _.each(metadata.entities, function(entity) {
                            metadata[entity] = self._objectifyBy(data[entity], 'name');
                        });

                        self.metadata = metadata;

                        defer.resolve(metadata);
                    })
                    .catch(function(err) {
                        defer.reject(err);
                    });
            }

            return defer.promise;
        };

        this.buildFiltersQuery = function(fields, filters) {
            return QueryBuilderSrv.buildFiltersQuery(fields, filters);
        };

        this.buildChartQuery = function(filter, query) {
            var criteria = _.without([filter, query], null, undefined, '', '*');

            return criteria.length === 1 ? criteria[0] : { _and: criteria };
        }
    });
})();
