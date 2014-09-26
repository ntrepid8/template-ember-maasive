/**
 * Created by jaustin on 9/14/14.
 */
var App = (function ($, Ember, siteTemplates, maasive) {
    var App;
    $.support.cors = true;
    if (debugApp) {
        App = Ember.Application.create({
            rootElement: '#maasive-app',
            LOG_TRANSITIONS: true,
            LOG_TRANSITIONS_INTERNAL: true
        });
    } else {
        App = Ember.Application.create({
            rootElement: '#maasive-app'
        });
    }
    App.Router.map(function () {
        this.route("index", { path: "/" });
    });
    App.ApplicationRoute = Ember.Route.extend({
        beforeModel: function () {
            var promises = [];
            siteTemplates.forEach(function (item) {
                if (!Ember.TEMPLATES[item]) {
                    promises.push(
                        $.get('templates/' + item.replace('/', '.') + '.hbs').then(function (data) {
                            Ember.TEMPLATES[item] = Ember.Handlebars.compile(data);
                        })
                    );
                }
            });
            promises.push(maasive.get('/auth/user/')
                .then(function (resp) {
                    App.set('currentUser', Ember.Object.create(resp.data[0]));

                }, function () {
                    App.set('currentUser', null);
                }));
            return Ember.RSVP.all(promises);
        },
        model: function(){
          var promises = {
            currentUser: maasive.get('/auth/user/')
                .then(function (resp) {
                  return Ember.Object.create(resp.data[0]);
                }, function () {
                    return null;
                })
          };
          return Ember.RSVP.hash(promises);
        },
        actions: {
            login: function (email, password) {
                var self = this;
                maasive.post('/auth/login/', {email: email, password: password})
                    .then(function (resp) {
                        self.refresh();
                    }, function (error) {
                        self.transitionTo('error');
                    });
            },
            logout: function () {
                maasive.auth.logout(function () {
                    App.set('currentUser', null);
                    App.set('managedApi', null);
                });
                this.transitionTo('index');
            }

        }
    });
    return App;
}($, Ember, siteTemplates, maasive));
