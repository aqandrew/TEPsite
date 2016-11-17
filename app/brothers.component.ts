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

	constructor (private brotherService: BrotherService) {
		console.log('Constructing BrotherComponent');
		this.colors = {
			'Magenta': '#a33558',
			'Green': '#296f4a',
			'Blue': '#224a6d',
			'Black': '#120e0d',
			'Pink': '#cb5966',
			'Yellow': '#cca328',
			'Purple': '#4b2645',
			'Red': '#a7000f',
			'White': '#c19d7b',
			'Orange': '#d14312'
		};
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

	drawBrotherBoards() {
		var self = this;
		var h = 600;

		// set the dimensions and margins of the graph

		var svg = d3.select('#brothers')
			.append('svg')
				//.attr('height', h)
				//.attr('height', '100%')
				.attr('width', '100%');

		var circles = svg.selectAll('circle')
			.data(self.brotherData)
			.enter()
			.append('circle');

		circles.attr('cx', '50%')
			.attr('cy', function (brother, brotherIndex) {
				return brotherIndex * 50 + 25;
			})
			.attr('r', 20)
			.style('fill', function (brother) { return self.getFounderColor(brother) });

		var names = svg.selectAll('text')
			.data(self.brotherData)
			.enter()
			.append('text')
				.text(function (brother) {
					return brother.firstName + ' ' + brother.lastName;
				})
				.attr('x', '50%')
				.attr('y', function (brother, brotherIndex) {
					return brotherIndex * 50 + 25;
				});

		console.log('data to draw brother boards: ', this.brotherData);

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

	getBrotherById(id) {
		return this.brotherData.find(function (brother) { return brother.brotherNumber == id });
	}

	// TODO remove repeated calculations by assigning colors in cleanBrotherData
	getFounderColor(brother) {
		var tempBro = brother;

		while (tempBro.bigBrotherNumber) {
			tempBro = this.getBrotherById(tempBro.bigBrotherNumber);
		}

		return this.colors[tempBro.option];
	}
}