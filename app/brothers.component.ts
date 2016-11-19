import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BrotherService } from './brother.service';
import { Brother } from './brother';
import { OrgChartDirective } from './org-chart.directive';
import { CORE_DIRECTIVES } from '@angular/common';

declare var Papa: any;
declare var d3: any;

@Component({
	selector: 'tepei-brothers',
	templateUrl: 'app/brothers.component.html',
	providers: [BrotherService],
	directives: [OrgChartDirective, CORE_DIRECTIVES]
})

export class BrothersComponent implements OnInit {
	errorMessage: string;
	brotherData: any;
	colors: {};
	rectWidth: number;

	constructor (private brotherService: BrotherService) {
		console.log('Constructing BrotherComponent');
		this.colors = {
			'Magenta': {
				'color': '#a33558',
				'order': 0
			},
			'Green': {
				'color': '#296f4a',
				'order': 1
			},
			'Blue': {
				'color': '#224a6d',
				'order': 2
			},
			'Black': {
				'color': '#120e0d',
				'order': 3
			},
			'Pink': {
				'color': '#cb5966',
				'order': 4
			},
			'Yellow': {
				'color': '#cca328',
				'order': 5
			},
			'Purple': {
				'color': '#4b2645',
				'order': 6
			},
			'Red': {
				'color': '#a7000f',
				'order': 7
			},
			'White': {
				'color': '#c19d7b',
				'order': 8
			},
			'Orange':{ 
				'color': '#d14312',
				'order': 9
			}
		};
		this.rectWidth = 150;
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
		context.drawBrotherBoards();
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

	getBrothers () {
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

	drawBrotherBoards () {
		var self = this;
		var h = 600;
		var rectHeight = 50;

		console.log('data to draw brother boards: ', this.brotherData);

		// set the dimensions and margins of the graph

		var svg = d3.select('#brother-board')
			.append('svg')
				//.attr('height', h)
				.attr('width', '1600');

		var rectangles = svg.selectAll('rect')
			.data(self.brotherData)
			.enter()
			.append('rect');

		rectangles.attr('x', function (brother) { return (self.rectWidth + 10) * self.getFounderOffset(brother) })
			.attr('y', function (brother) {
				//return brotherIndex * rectHeight + 25;
				return rectHeight * self.getPledgeClassHeight(brother) + 30;
			})
			.attr('width', self.rectWidth)
			.attr('height', 20)
			.style('fill', function (brother) { return self.getFounderColor(brother) });

		var names = svg.selectAll('text')
			.data(self.brotherData)
			.enter()
			.append('text')
				.text(function (brother, brotherIndex) {
					return brother.firstName + ' ' + brother.lastName;
				})
				.attr('x', function (brother) { return (self.rectWidth + 10) * self.getFounderOffset(brother) + self.rectWidth / 2 })
				.attr('y', function (brother) {
					//return brotherIndex * rectHeight + 25;
					return rectHeight * self.getPledgeClassHeight(brother) + 30;
				})
				.attr('text-anchor', 'middle');

		// TODO convert to SVG
		/*var boards = d3.select('#brothers')
			.selectAll('div')
				.data(self.brotherData)
				.enter()
				.append('p')
				.text(function (d) {
					return JSON.stringify(d);
				})
				// TODO assign background color with CSS classes
				.style('background-color', function (brother) {
					return self.getFounderColor(brother);
				})
				.classed('silver-text', function (brother) {
					return self.getFounderColor(brother) == self.colors['Black'];
				});*/
	}

	getBrotherById (id) {
		return this.brotherData.find(function (brother) { return brother.brotherNumber == id });
	}

	// TODO remove repeated calculations by assigning colors in cleanBrotherData
	getFounderColor (brother) {
		var tempBro = brother;

		while (tempBro.bigBrotherNumber) {
			tempBro = this.getBrotherById(tempBro.bigBrotherNumber);
		}

		return this.colors[tempBro.option].color;
	}

	getFounderOffset (brother) {
		var tempBro = brother;

		while (tempBro.bigBrotherNumber) {
			tempBro = this.getBrotherById(tempBro.bigBrotherNumber);
		}

		return this.colors[tempBro.option].order;
	}

	getPledgeClassHeight (brother) {
		var pledgeClasses = [];

		for (var i = 0; i < this.brotherData.indexOf(brother); i++) {
			var thisPledgeClass = this.brotherData[i].pledgeClass;

			if (!pledgeClasses.includes(thisPledgeClass)) {
				pledgeClasses.push(thisPledgeClass);
			}
		}

		return this.isPcp(brother)? pledgeClasses.length : pledgeClasses.length - 1;
	}

	isPcp (brother) {
		var prevBrother = this.brotherData[this.brotherData.indexOf(brother) - 1];

		return this.brotherData.indexOf(brother) == 0 || brother.pledgeClass != prevBrother.pledgeClass;
	}
}