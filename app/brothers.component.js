"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var brother_service_1 = require('./brother.service');
var org_chart_directive_1 = require('./org-chart.directive');
var common_1 = require('@angular/common');
var BrothersComponent = (function () {
    function BrothersComponent(brotherService, _ngZone) {
        this.brotherService = brotherService;
        this._ngZone = _ngZone;
        console.log('Constructing BrotherComponent');
        /*window.angularComponentRef = {
            component: this,
            zone: _ngZone
        };*/
    }
    BrothersComponent.prototype.getBrotherData = function () {
        /*window.angularComponent.zone.run(() => {
            
        });*/
    };
    BrothersComponent.prototype.ngOnInit = function () {
        this.getBrothers();
    };
    // data is usable here
    BrothersComponent.prototype.cleanBrotherData = function (context, data) {
        // Remove depledges.
        data = data.filter(function (person) { return person.option != 'Depledge'; });
        // Ensure brothers with no pledge class listed are given the PCP's pledge class.
        var currentPledgeClass = '';
        for (var b = 0; b < data.length; b++) {
            if (data[b].pledgeClass) {
                currentPledgeClass = data[b].pledgeClass;
            }
            else {
                data[b].pledgeClass = currentPledgeClass;
            }
        }
        //console.log('cleanBrotherData: ', data);
        context.brotherData = data;
        return data;
    };
    BrothersComponent.prototype.initializeBrotherData = function (file, callBack) {
        var self = this; // preserve calling context for interior of parse.complete
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function (results) {
                callBack(self, results.data);
            }
        });
    };
    BrothersComponent.prototype.getBrothers = function () {
        var self = this; // preserve calling context for interior of Observable.subscribe
        this.brotherService.getBrothers()
            .subscribe(function (brothers) {
            self.initializeBrotherData(brothers, self.cleanBrotherData);
        }, 
        //brothers => this.brotherData = brothers,
        function (error) { this.errorMessage = error; });
        //error => this.errorMessage = <any>error);
    };
    BrothersComponent = __decorate([
        core_1.Component({
            selector: 'tepei-brothers',
            templateUrl: 'app/brothers.component.html',
            providers: [brother_service_1.BrotherService],
            directives: [org_chart_directive_1.OrgChartDirective, common_1.CORE_DIRECTIVES]
        }), 
        __metadata('design:paramtypes', [brother_service_1.BrotherService, core_1.NgZone])
    ], BrothersComponent);
    return BrothersComponent;
}());
exports.BrothersComponent = BrothersComponent;
//# sourceMappingURL=brothers.component.js.map