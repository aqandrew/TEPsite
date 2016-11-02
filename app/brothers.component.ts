import { Component, OnInit, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BrotherService } from './brother.service';
import { Brother } from './brother';
import { OrgChartDirective } from './org-chart.directive';
import { CORE_DIRECTIVES } from '@angular/common';

declare var Papa: any;

@Component({
	selector: 'tepei-brothers',
	templateUrl: 'app/brothers.component.html',
	providers: [BrotherService],
	directives: [OrgChartDirective, CORE_DIRECTIVES]
})

export class BrothersComponent implements OnInit {
	errorMessage: string;
	brotherData: Brother[];

	constructor (private brotherService: BrotherService, private _ngZone: NgZone) {
		console.log('Constructing BrotherComponent');
		/*window.angularComponentRef = {
			component: this,
			zone: _ngZone
		};*/
	}

	getBrotherData(): void {
		/*window.angularComponent.zone.run(() => {
			
		});*/
	}

	ngOnInit(): void {
		this.getBrothers();
	}

	// data is usable here
	cleanBrotherData (context, data) {
		// Remove depledges.
		data = data.filter(function (person) { return person.option != 'Depledge' });

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
	}

	initializeBrotherData (file, callBack) {
		var self = this; // preserve calling context for interior of parse.complete

		Papa.parse(file, {
			header: true,
			dynamicTyping: true,
			complete: function (results) {
				callBack(self, results.data);
			}
		});
	}

	getBrothers() {
		var self = this; // preserve calling context for interior of Observable.subscribe

		this.brotherService.getBrothers()
			.subscribe(
				function (brothers) {
					self.initializeBrotherData(brothers, self.cleanBrotherData);
				},
				//brothers => this.brotherData = brothers,
				function (error) { this.errorMessage = <any>error; });
				//error => this.errorMessage = <any>error);
	}
}