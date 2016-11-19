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

		var el = document.getElementById('brother-board');
		var divStyle = window.getComputedStyle(el, null).getPropertyValue('font-size');
		var fontSize = parseFloat(divStyle); 

		//console.log('data to draw brother boards: ', this.brotherData);

		var svg = d3.select('#brother-board')
			.append('svg')
				.attr('width', '1600');

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
			.style('fill', function (brother) { return self.getFounderColor(brother); });
		
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
				});

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
			.attr('fill', function (brother) {
				var isSilver = self.getFounderColor(brother) == self.colors['Black'].color;
				return isSilver ? '#b3b3ad' : 'black';
			});
	}

	getBrotherById (id) {
		return this.brotherData.find(function (brother) { return brother.brotherNumber == id });
	}

	getBigBrother (brother) {
		return this.getBrotherById(brother.bigBrotherNumber);
	}

	// TODO remove repeated calculations by assigning colors in cleanBrotherData
	getFounderColor (brother) {
		var someBro = brother;

		while (someBro.bigBrotherNumber) {
			someBro = this.getBrotherById(someBro.bigBrotherNumber);
		}

		return this.colors[someBro.option].color;
	}

	getFounderOffset (brother) {
		var someBro = brother;

		while (someBro.bigBrotherNumber) {
			someBro = this.getBrotherById(someBro.bigBrotherNumber);
		}

		return this.colors[someBro.option].order;
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
			return self.getFounderColor(someBrother) == self.getFounderColor(brother);
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
		return (this.rectWidth + 10) * this.getFounderOffset(brother) +
					((this.rectWidth / 2) * this.nthSameTreePledgeBro(brother));
	}
}