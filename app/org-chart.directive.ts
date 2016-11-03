/*
	This directive draws a fraternity lineage chart based on supplied info.
	Credits to Cyril Cherian on StackOverflow.
*/

import { Directive, Input, ElementRef } from '@angular/core';

@Directive({
	selector: 'org-chart'
})

export class OrgChartDirective {
	el: HTMLElement;
	w: any; // To store the window, without generating errors in typescript on window.google
	private _content: any[] = [];

	// Setter for content will trigger drawing (or refreshing)
	@Input()
	set content(c: any[]) {
		console.log('Setting content...');
		this._content = c;
		this.draw();
	}

	get content() { return this._content; }

	// Constructor injects a reference to the element
	constructor(elementRef: ElementRef) {
		console.log('Constructing org-chart directive');
		this.w = window;
		this.el = elementRef.nativeElement; // elementRef cannot be used directly
	}

	draw() {
		let rows = [['brotherName', 'bigBrotherName']];

		// TODO Ensure tree colors are inherited from big brother
		for (let broIndex in this._content) {
			let bro = this._content[broIndex];
			//console.log('bro is ' + JSON.stringify(bro));
			let displayName = this.getDisplayName(bro);
			//console.log('displayName is ' + displayName);

			// Don't designate a big brother for founders.
			if (bro.pledgeClass == 'Founders') {
				rows.push([displayName, '']);
			}
			else {
				let bigBrother = this.getDisplayName(this.getBrotherById(bro.bigBrotherNumber));
				//console.log('\tbigBrother is ' + bigBrother);
				rows.push([displayName, bigBrother]);
			}
		}
		
		console.log(rows);

		// TODO draw the chart using d3.js.
		//(new this.w.google.visualization.OrgChart(this.el)).draw(data, options);
	}

	getBrotherById(id) {
		//console.log('\tgetBrotherById.id is ' + id);
		for (var broIndex = 0; broIndex < this._content.length; broIndex++) {
			if (this._content[broIndex].brotherNumber == id) {
				return this._content[broIndex];
			}
		}
	}

	getDisplayName(brother) {
		//console.log('\tgetDisplayName.brother is ' + JSON.stringify(brother));
		return brother.firstName + ' ' + brother.lastName + '\n\"' + brother.pledgeName + '\"';
	}
}