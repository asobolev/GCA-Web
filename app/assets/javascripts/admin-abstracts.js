require(["main"], function () {
require(["lib/models", "lib/tools", "lib/astate", "knockout"], function(models, tools, astate, ko) {
    "use strict";


    /**
     * admin/abstracts view model.
     *
     *
     * @param confId
     * @returns {OwnersListViewModel}
     * @constructor
     */
    function adminAbstractsViewModel(confId) {

        if (! (this instanceof adminAbstractsViewModel)) {
            return new adminAbstractsViewModel(confId);
        }

        var self = this;

        self.message = ko.observable(null);
        self.abstractsData = null;
        self.conference = ko.observable(null);
        self.abstracts = ko.observableArray(null);
        self.abstractNumbers = ko.observable({ total: 0, active: 0 });

        //state related things
        self.stateHelper = astate.changeHelper;
        self.selectedAbstract = ko.observable(null);
        self.selectableStates = ko.observableArray(['InPreparation', 'Submitted', 'InReview', 'Accepted', 'Rejected', 'InRevision', 'Withdrawn']);

        self.selectedStates = ko.observableArray(['Submitted', 'InReview', 'Accepted', 'Rejected', 'InRevision']);

        ko.bindingHandlers.bsChecked = {
            init: function(element, valueAccessor) {
                $(element).change(function() {

                    var value = ko.unwrap(valueAccessor());
                    var this_val = $(this).val();
                    var is_active = ! $(this.parentElement).hasClass('active'); //we are doing this before the change
                    var idx = value.indexOf(this_val);

                    var change = true;
                    if (!is_active && idx > -1) {
                        value.splice(idx, 1);
                    } else if (is_active && idx < 0) {
                        value.push(this_val);
                    } else {
                        change = false;
                    }

                    if (change) {
                        //we don't seem to trigger notifications automatically
                        valueAccessor().notifySubscribers(value, 'arrayChange');
                    }

                });
            },
            update: function(element, valueAccessor, allBindings) {
                // First get the latest data that we're bound to
                var value = ko.unwrap(valueAccessor());
                var myval = $(element).val();
                var idx = value.indexOf(myval);

                var should_be_active = idx > -1;
                var is_active = $(element.parentElement).hasClass('active');

                if (should_be_active != is_active) {
                    $(element.parentElement).toggleClass('active');
                }
            }
        };

        self.showAbstractsWithState = function(visibleStates) {
            var new_list = self.abstractsData.filter(function(elm) {
                return visibleStates.indexOf(elm.state()) > -1;
            });

            self.abstracts(new_list);
            self.abstractNumbers({ total: self.abstractsData.length, active: new_list.length });
        };

        self.selectedStates.subscribe(self.showAbstractsWithState, 'null', 'arrayChange');

        self.init = function() {
            self.ensureData();
            ko.applyBindings(window.dashboard);
        };

        self.isLoading = function(status) {
            if (status === false) {
                self.message(null);
            } else {
                self.message({message: "Loading data!", level: "alert-info", desc: "Please wait..."});
            }
        };

        self.onSelStateClick = function() {
            console.log('clicked');
            console.log($(this));
        };

        self.setError = function(level, text, description) {
            if (text === null) {
                self.message(null);
            } else {
                self.message({message: text, level: 'alert-' + level, desc: description});
            }
        };

        //helper functions
        self.makeAbstractLink = function(abstract) {
            return "/myabstracts/" + abstract.uuid + "/edit";
        };

        self.setState = function(abstract, state, note) {
            var oldState = abstract.state();

            var data = {state: state};
            if (note) {
                data.note = note;
            }

            abstract.state("Saving...");
            $.ajax("/api/abstracts/" + abstract.uuid + '/state', {
                data: JSON.stringify(data),
                type: "PUT",
                contentType: "application/json",
                success: function(result) {
                    abstract.state(state);
                },
                error: function(jqxhr, textStatus, error) {
                    abstract.state(oldState);
                    self.setError("danger", "Error while updating the state", error);
                }
            });
        };

        self.beginStateChange = function(abstract) {
            $('#note').val(""); //reset the message box
            $('#state-dialog').modal('show');
            self.selectedAbstract(abstract);
        };

        self.finishStateChange = function() {
            var note = $('#note').val();
            var state = $('#state-dialog').find('select').val();

            self.setState(self.selectedAbstract(), state, note);
            self.selectedAbstract();
        };

        self.mkAuthorList = function(abstract) {

            if(abstract.authors.length < 1) {
                return "";
            }

            var text = abstract.authors[0].lastName;

            if (abstract.authors.length > 1) {
                text += " et. al.";
            }

            return text;
        };

        //Data IO
        self.ioFailHandler = function(jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log( "Request Failed: " + err );
            self.setError("danger", "Error while fetching data from server", error);
        };

        self.ensureData = function() {
            console.log("ensureDataAndThen::");
            self.isLoading(true);
            if (self.abstractsData !== null) {
                self.isLoading(false);
                return;
            }

            //now load the data from the server
            var confURL ="/api/conferences/" + confId;
            $.getJSON(confURL, onConferenceData).fail(self.ioFailHandler);

            //conference data
            function onConferenceData(confObj) {
                var conf = models.Conference.fromObject(confObj);
                self.conference(conf);
                //now load the abstract data
                $.getJSON(confURL + "/allAbstracts", onAbstractData).fail(self.ioFailHandler);
            }

            //abstract data
            function onAbstractData(absArray) {
                var absList = models.Abstract.fromArray(absArray);

                absList.forEach(function (abstr) {

                    abstr.makeObservable(['state']);
                    abstr.possibleStates = ko.computed(function () {
                        var fromState = abstr.state();

                        if (fromState === 'Saving...') {
                            return [];
                        }

                        return self.stateHelper.getPossibleStatesFor(fromState, true, self.conference().isOpen);
                    });

                    abstr.viewEditCtx = ko.computed(function () {
                        //only time that admins can make changes is in the InRevision state
                        var canEdit = abstr.state() == "InRevision";

                        return {
                            link: canEdit ? "/myabstracts/" + abstr.uuid + "/edit" : "/abstracts/" + abstr.uuid,
                            label: canEdit ? "Edit" : "View",
                            btn: canEdit ? "btn-danger" : "btn-primary"
                        };

                    });
                });

                self.abstractsData = absList;
                self.showAbstractsWithState(self.selectedStates());
                self.isLoading(false);
            }
        };

    }

    $(document).ready(function() {

        var data = tools.hiddenData();

        console.log(data.conferenceUuid);

        window.dashboard = adminAbstractsViewModel(data.conferenceUuid);
        window.dashboard.init();
    });


});
});