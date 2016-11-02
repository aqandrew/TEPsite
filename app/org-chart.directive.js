/*
    This directive draws a Google Org Chart based on supplied fraternity info.
    Credits to xavier268 on StackOverflow.
*/
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var core_1 = require('@angular/core');
//declare var google: any;
var OrgChartDirective = (function () {
    // Constructor injects a reference to the element
    function OrgChartDirective(elementRef) {
        this._content = [];
        console.log('Constructing org-chart directive');
        this.w = window;
        this.el = elementRef.nativeElement; // elementRef cannot be used directly
        var google = this.w.google;
        //console.log('content.google is: ', google);
        if (!this.w.google) {
            console.error('The required Google script was not loaded.');
        }
        else {
            console.log('You got the Google son!');
        }
        if (!this.w.google.visualization) {
            console.error('no this.w.google.visualization');
        }
        else {
            console.log('this.w.google.visualization is all gooood');
        }
    }
    Object.defineProperty(OrgChartDirective.prototype, "content", {
        get: function () { return this._content; },
        // Setter for content will trigger drawing (or refreshing)
        set: function (c) {
            console.log('Setting content...');
            this._content = c;
            this.draw();
        },
        enumerable: true,
        configurable: true
    });
    OrgChartDirective.prototype.draw = function () {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('this.w.google: ', this.w.google);
            var rows = [['brotherName', 'bigBrotherName', 'ToolTip']];
            // TODO Ensure tree colors are inherited from big brother
            for (var broIndex in this._content) {
                var bro = this._content[broIndex];
                //console.log('bro is ' + JSON.stringify(bro));
                var displayName = this.getDisplayName(bro);
                //console.log('displayName is ' + displayName);
                // Don't designate a big brother for founders.
                if (bro.pledgeClass == 'Founders') {
                    rows.push([displayName, '', 'ASUH DUDE']);
                }
                else {
                    var bigBrother = this.getDisplayName(this.getBrotherById(bro.bigBrotherNumber));
                    //console.log('\tbigBrother is ' + bigBrother);
                    rows.push([displayName, bigBrother, 'asuh dude']);
                }
            }
            var data = this.w.google.visualization.arrayToDataTable(rows, false // designate first row as labels
            );
            console.log(rows);
            //console.log(data);
            //data.setRowProperty(0, 'style', 'opacity: 0'); // only works with async draw
            var options = {
                allowHtml: true,
                size: 'small' /*,
                nodeClass: 'node'*/
            };
            // Instantiate and draw the chart using the specified options.
            (new this.w.google.visualization.OrgChart(this.el))
                .draw(data, options);
        });
    };
    OrgChartDirective.prototype.getBrotherById = function (id) {
        //console.log('\tgetBrotherById.id is ' + id);
        for (var broIndex = 0; broIndex < this._content.length; broIndex++) {
            if (this._content[broIndex].brotherNumber == id) {
                return this._content[broIndex];
            }
        }
    };
    OrgChartDirective.prototype.getDisplayName = function (brother) {
        //console.log('\tgetDisplayName.brother is ' + JSON.stringify(brother));
        return brother.firstName + ' ' + brother.lastName + '\n\"' + brother.pledgeName + '\"';
    };
    OrgChartDirective.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Array), 
        __metadata('design:paramtypes', [Array])
    ], OrgChartDirective.prototype, "content", null);
    OrgChartDirective = __decorate([
        core_1.Directive({
            selector: 'org-chart'
        }), 
        __metadata('design:paramtypes', [core_1.ElementRef])
    ], OrgChartDirective);
    return OrgChartDirective;
}());
exports.OrgChartDirective = OrgChartDirective;
//# sourceMappingURL=org-chart.directive.js.map