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
	colors: string[];
	rectWidth: number;

	constructor (private brotherService: BrotherService) {
		console.log('Constructing BrotherComponent');
		this.colors = ['Magenta', 'Green', 'Blue', 'Black', 'Pink', 'Yellow', 'Purple', 'Red', 'White', 'Orange'];
		this.rectWidth = 150;
	}

	ngOnInit(): void {
		this.getBrothers();
	}

	// data is usable here
	cleanBrotherData (context, data) {
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

			// Ensure brothers with no color are given their respective founder's color.
			// TODO remove repeated calculations
			if (!data[b].option) {
				var someBro = data[b];

				while (someBro.bigBrotherNumber) {
					someBro = data.find(function (anotherBrother) { return someBro.bigBrotherNumber == anotherBrother.brotherNumber; });
				}

				data[b].option = someBro.option;
			}
		}

		console.log('cleanBrotherData: ', data);
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

		var el = document.getElementById('brother-board');
		var divStyle = window.getComputedStyle(el, null).getPropertyValue('font-size');
		var fontSize = parseFloat(divStyle); 

		//console.log('data to draw brother boards: ', this.brotherData);

		var svg = d3.select('#brother-board')
			.append('svg')
				.attr('width', 1600);

		var background = svg.append('rect')
			.attr('height', 2500) // TODO temporary values
			.attr('width', 1600)
			.style('fill', '#dde2eb');

		var nodes = svg.selectAll('g.node')
			.data(self.brotherData)
			.enter()
				.append('g');

		var rectangles = nodes.append('rect')
			.attr('x', function (brother) {
				var x0 = self.getHorizOffset(brother);
				brother.x0 = x0;
				return x0;
			})
			.attr('y', function (brother) {
				var y0 = rectHeight * self.getPledgeClassHeight(brother) + 30;
				brother.y0 = y0;
				return y0;
			})
			.attr('width', self.rectWidth)
			.attr('height', 20)
			.attr('class', function (brother) { return brother.option.toLowerCase(); });
		
		var links = svg.selectAll('path.link')
			.data(self.brotherData)
			.enter()
				.insert('path', 'g')
				.attr('class', 'link')
				.attr('d', function (brother) {
					if (brother.pledgeClass != 'Founders') {
						var bigBrother = self.getBigBrother(brother);
						return 'M' + brother.x0 + ',' + brother.y0 +
							'C' + (brother.x0 + bigBrother.x0) / 2 + ',' + brother.y0 +
							' ' + (brother.x0 + bigBrother.x0) / 2 + ',' + bigBrother.y0 +
							' ' + bigBrother.x0 + ',' + bigBrother.y0;
					}
				})
				.attr('transform', 'translate(' + self.rectWidth / 2 + ')'); // centered with respect to each rectangle

		var names = nodes.append('text')
			.text(function (brother) {
				return brother.firstName + ' ' + brother.lastName;
			})
			.attr('x', function (brother) {
				return self.getHorizOffset(brother) + self.rectWidth / 2; // to center text in rectangle
				})
			.attr('y', function (brother) {
				return rectHeight * self.getPledgeClassHeight(brother) + 30 + fontSize;
			})
			.attr('text-anchor', 'middle')
			.attr('class', function (brother) {
				var isSilver = brother.option == 'Black';
				return isSilver ? 'silver-text' : 'black';
			});
	}

	getBrotherById (id) {
		return this.brotherData.find(function (brother) { return brother.brotherNumber == id });
	}

	getBigBrother (brother) {
		return this.getBrotherById(brother.bigBrotherNumber);
	}

	getTreeOffset (brother) {
		return this.colors.indexOf(brother.option);
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

	getBigDistance (brother) {
		if (!brother.bigBrotherNumber) {
			return 0;
		}

		var bigBrother = this.getBrotherById(brother.bigBrotherNumber);
		var prevBrother = this.brotherData[this.brotherData.indexOf(brother) - 1];

		var pledgeClasses = [];
		while (true) {
			var thisPledgeClass = prevBrother.pledgeClass;

			if (!pledgeClasses.includes(thisPledgeClass)) {
				pledgeClasses.push(thisPledgeClass);
			}

			if (thisPledgeClass == bigBrother.pledgeClass) {
				break;
			}

			prevBrother = this.brotherData[this.brotherData.indexOf(prevBrother) - 1];
		}

		return this.isPcp(brother) ? pledgeClasses.length : pledgeClasses.length - 1;
	}

	getPledgeClass (brother) {
		return this.brotherData.filter(function (someBrother) { return someBrother.pledgeClass == brother.pledgeClass; });
	}

	nthSameTreePledgeBro (brother) {
		var self = this;
		var sameTreePledgeBros = this.getPledgeClass(brother).filter(function (someBrother) {
			return someBrother.option == brother.option;
		});

		var n = 0;
		while (n < sameTreePledgeBros.length) {
			if (sameTreePledgeBros[n].brotherNumber == brother.brotherNumber) {
				break;
			}

			n++;
		}

		return n;
	}

	getHorizOffset (brother) {
		return (this.rectWidth + 10) * this.getTreeOffset(brother) +
					((this.rectWidth / 2) * this.nthSameTreePledgeBro(brother));
	}
}