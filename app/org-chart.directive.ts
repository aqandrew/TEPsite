/*
	This directive draws a Google Org Chart based on supplied fraternity info.
	Credits to xavier268 on StackOverflow.
*/

import { Directive, Input, ElementRef } from '@angular/core';

//declare var google: any;

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

		let google = this.w.google;
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

	async draw() {
		//console.log('this.w.google: ', this.w.google);
		
		let rows = [['brotherName', 'bigBrotherName', 'ToolTip']];

		// TODO Ensure tree colors are inherited from big brother
		for (let broIndex in this._content) {
			let bro = this._content[broIndex];
			//console.log('bro is ' + JSON.stringify(bro));
			let displayName = this.getDisplayName(bro);
			//console.log('displayName is ' + displayName);

			// Don't designate a big brother for founders.
			if (bro.pledgeClass == 'Founders') {
				rows.push([displayName, '', 'ASUH DUDE']);
			}
			else {
				let bigBrother = this.getDisplayName(this.getBrotherById(bro.bigBrotherNumber));
				//console.log('\tbigBrother is ' + bigBrother);
				rows.push([displayName, bigBrother, 'asuh dude']);
			}
		}

		let data = this.w.google.visualization.arrayToDataTable(
			rows,
			false // designate first row as labels
		);
		
		console.log(rows);
		//console.log(data);
		//data.setRowProperty(0, 'style', 'opacity: 0'); // only works with async draw

		let options: any = {
			allowHtml: true,
			size: 'small'/*,
			nodeClass: 'node'*/
		};

		// Instantiate and draw the chart using the specified options.
		(new this.w.google.visualization.OrgChart(this.el))
			.draw(data, options);
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

	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}