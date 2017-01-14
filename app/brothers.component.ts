import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BrotherService } from './brother.service';
import { Brother } from './brother';
import { CORE_DIRECTIVES } from '@angular/common';

declare var Papa: any;
declare var d3: any;
// declare var Newick: any;

@Component({
	selector: 'tepei-brothers',
	templateUrl: 'app/brothers.component.html',
	providers: [BrotherService],
	directives: [CORE_DIRECTIVES]
})

export class BrothersComponent implements OnInit {
	errorMessage: string;
	brotherData: any;
	colors: string[];
	rectWidth: number;
	rectSpacingX: number;
	rectSpacingY: number;
	phyloTrees: string[];

	constructor (private brotherService: BrotherService) {
		//console.log('Constructing BrotherComponent');
		this.colors = ['Magenta', 'Green', 'Blue', 'Black', 'Pink', 'Yellow', 'Purple', 'Red', 'White', 'Orange'];
		this.rectWidth = 150;
		this.rectSpacingX = 10;
		this.rectSpacingY = 30;
	}

	ngOnInit(): void {
		this.getBrothers();
	}

	// data is usable here
	cleanBrotherData (context, data) {
		let alphabet = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
			'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'];
		let alphabetTau = alphabet.map(letter => 'Tau ' + letter);
		let alphabetEpsilon = alphabet.map(letter => 'Epsilon ' + letter);
		var pledgeClasses = ['Founders'].concat(alphabet).concat(alphabetTau).concat(alphabetEpsilon);
		// console.log(pledgeClasses);

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

			let bigBroPledgeClass = data[b].pledgeClass == 'Founders' ? 0 : pledgeClasses.indexOf(data.find(bro => bro.brotherNumber == data[b].bigBrotherNumber).pledgeClass);
			data[b].bigDistance = pledgeClasses.indexOf(data[b].pledgeClass) - bigBroPledgeClass;
			// console.log(`${data[b].firstName} ${data[b].lastName} bigDistance: ${data[b].bigDistance}`);
		}

		console.log('cleanBrotherData: ', data);
		context.brotherData = data;
		context.constructPhyloTrees();
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

	constructPhyloTrees() {
		this.phyloTrees = [];
		let founders = this.brotherData.slice(0, 10);
		for (let founderNum = 0; founderNum < founders.length; founderNum++) {
			let newickTreeText = this.writeNewickString(founders[founderNum]);
			this.phyloTrees.push(newickTreeText);
		}

		console.log(this.phyloTrees);
	}

	writeNewickString(brother) {
		let hisLittles = this.getLittles(brother);
		let nodeRepresentation = someBrother => someBrother.brotherNumber + (!someBrother.bigBrotherNumber ? '' : ':' + this.getBigDistance(someBrother));
		return !hisLittles.length ? nodeRepresentation(brother) : '(' + hisLittles.map(someBrother => this.writeNewickString(someBrother)).join(',') + ')' + nodeRepresentation(brother);
	}

	getLittles(brother) {
		return this.brotherData.filter((someBrother) => { return someBrother.bigBrotherNumber == brother.brotherNumber; });
	}

	drawBrotherBoards () {
		var self = this;
		var h = 600;
		var rectHeight = 50;
		var svgWidth = this.phyloTrees.length * (this.rectWidth + this.rectSpacingX) + this.rectSpacingX;

		var el = document.getElementById('brother-board');
		var divStyle = window.getComputedStyle(el, null).getPropertyValue('font-size');
		var fontSize = parseFloat(divStyle); 

		//console.log('data to draw brother boards: ', this.brotherData);

		// Copyright 2016 Mike Bostock https://d3js.org
		var outerRadius = 960 / 2,
    		innerRadius = outerRadius - 170;

		var color = d3.scaleOrdinal()
			.domain(["Bacteria", "Eukaryota", "Archaea"])
			.range(d3.schemeCategory10);

		var cluster = d3.cluster()
			.size([360, innerRadius])
			.separation(function(a, b) { return 1; });

		var svg = d3.select("#brother-board").append("svg")
			.attr("width", outerRadius * 2)
			.attr("height", outerRadius * 2);

		// Copyright 2011 Jason Davies https://github.com/jasondavies/newick.js
		function parseNewick(a){for(var e=[],r={},s=a.split(/\s*(;|\(|\)|,|:)\s*/),t=0;t<s.length;t++){var n=s[t];switch(n){case"(":var c={};r.branchset=[c],e.push(r),r=c;break;case",":var c={};e[e.length-1].branchset.push(c),r=c;break;case")":r=e.pop();break;case":":break;default:var h=s[t-1];")"==h||"("==h||","==h?r.name=n:":"==h&&(r.length=parseFloat(n))}}return r}

		var chart = svg.append("g")
			.attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

		// TODO test using The Best Tree
		var sampleTree = this.brotherData.filter(brother => brother.option == 'Green');
		var life = this.writeNewickString(sampleTree[0]);
		console.log(life);
		var root = d3.hierarchy(parseNewick(life), function(d) { return d.branchset; })
			.sum(function(d) { return d.branchset ? 0 : 1; })
			.sort(function(a, b) { return (a.value - b.value) || d3.ascending(a.data.length, b.data.length); });
      	console.log(root);

  		cluster(root);

		var input = d3.select("#show-length input").on("change", changed),
			timeout = setTimeout(function() { input.property("checked", true).each(changed); }, 2000);

		setRadius(root, root.data.length = 0, innerRadius / maxLength(root));
		setColor(root);

		var linkExtension = chart.append("g")
			.attr("class", "link-extensions")
			.selectAll("path")
			.data(root.links().filter(function(d) { return !d.target.children; }))
			.enter().append("path")
				.each(function(d) { d.target.linkExtensionNode = this; })
				.attr("d", linkExtensionConstant);

		var link = chart.append("g")
			.attr("class", "links")
			.selectAll("path")
			.data(root.links())
			.enter().append("path")
				.each(function(d) { d.target.linkNode = this; })
				.attr("d", linkConstant)
				.attr("stroke", function(d) { return d.target.color; });

		// TODO align non-leaf brother names with correct radius
		chart.append("g")
			.attr("class", "labels")
			.selectAll("text")
			.data(root.descendants())
			.enter().append("text")
				.attr("dy", ".31em")
				.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (innerRadius + 4) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
				.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
				.text(function(d) { let bro = self.getBrotherById(d.data.name); return bro.firstName + ' ' + bro.lastName; })
				.on("mouseover", mouseovered(true))
				.on("mouseout", mouseovered(false));

		function changed() {
			clearTimeout(timeout);
			var t = d3.transition().duration(750);
			linkExtension.transition(t).attr("d", this.checked ? linkExtensionVariable : linkExtensionConstant);
			link.transition(t).attr("d", this.checked ? linkVariable : linkConstant);
		}

		function mouseovered(active) {
			return function(d) {
				d3.select(this).classed("label--active", active);
				d3.select(d.linkExtensionNode).classed("link-extension--active", active).each(moveToFront);
				do d3.select(d.linkNode).classed("link--active", active).each(moveToFront); while (d = d.parent);
			};
		}

		function moveToFront() {
			this.parentNode.appendChild(this);
		}

		// Compute the maximum cumulative length of any node in the tree.
		function maxLength(d) {
			return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
		}

		// Set the radius of each node by recursively summing and scaling the distance from the root.
		function setRadius(d, y0, k) {
			d.radius = (y0 += d.data.length) * k;
			if (d.children) d.children.forEach(function(d) { setRadius(d, y0, k); });
		}

		// Set the color of each node by recursively inheriting.
		function setColor(d) {
			var name = d.data.name;
			d.color = color.domain().indexOf(name) >= 0 ? color(name) : d.parent ? d.parent.color : null;
			if (d.children) d.children.forEach(setColor);
		}

		function linkVariable(d) {
			return linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius);
		}

		function linkConstant(d) {
			return linkStep(d.source.x, d.source.y, d.target.x, d.target.y);
		}

		function linkExtensionVariable(d) {
			return linkStep(d.target.x, d.target.radius, d.target.x, innerRadius);
		}

		function linkExtensionConstant(d) {
			return linkStep(d.target.x, d.target.y, d.target.x, innerRadius);
		}

		// Like d3.svg.diagonal.radial, but with square corners.
		function linkStep(startAngle, startRadius, endAngle, endRadius) {
		var c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI),
			s0 = Math.sin(startAngle),
			c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI),
			s1 = Math.sin(endAngle);
		return "M" + startRadius * c0 + "," + startRadius * s0
			+ (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
			+ "L" + endRadius * c1 + "," + endRadius * s1;
		}

		// var nodes = svg.selectAll('g.node')
		// 	.data(self.brotherData)
		// 	.enter()
		// 		.append('g');

		// var rectangles = nodes.append('rect')
		// 	.attr('x', function (brother) {
		// 		var x0 = self.getHorizOffset(brother);
		// 		brother.x0 = x0;
		// 		return x0;
		// 	})
		// 	.attr('y', function (brother) {
		// 		var y0 = rectHeight * (self.getPledgeClassHeight(brother) /*+ self.getBigDistance(brother)*/) + self.rectSpacingY;
		// 		brother.y0 = y0;
		// 		return y0;
		// 	})
		// 	.attr('width', self.rectWidth)
		// 	.attr('height', 20)
		// 	.attr('class', function (brother) { return brother.option.toLowerCase(); });
		
		// var links = svg.selectAll('path.link')
		// 	.data(self.brotherData)
		// 	.enter()
		// 		.insert('path', 'g')
		// 		.attr('class', 'link')
		// 		.attr('d', function (brother) {
		// 			if (brother.pledgeClass != 'Founders') {
		// 				var bigBrother = self.getBigBrother(brother);
		// 				return 'M' + brother.x0 + ',' + brother.y0 +
		// 					'C' + (brother.x0 + bigBrother.x0) / 2 + ',' + brother.y0 +
		// 					' ' + (brother.x0 + bigBrother.x0) / 2 + ',' + bigBrother.y0 +
		// 					' ' + bigBrother.x0 + ',' + bigBrother.y0;
		// 			}
		// 		})
		// 		.attr('transform', 'translate(' + self.rectWidth / 2 + ')'); // centered with respect to each rectangle

		// var names = nodes.append('text')
		// 	.text(function (brother) {
		// 		// TODO add pledge names
		// 		return brother.firstName + ' ' + brother.lastName;
		// 	})
		// 	.attr('x', function (brother) {
		// 		return self.getHorizOffset(brother) + self.rectWidth / 2; // to center text in rectangle
		// 		})
		// 	.attr('y', function (brother) {
		// 		return rectHeight * self.getPledgeClassHeight(brother) + self.rectSpacingY + fontSize;
		// 	})
		// 	.attr('text-anchor', 'middle')
		// 	.attr('class', function (brother) {
		// 		var isSilver = brother.option == 'Black';
		// 		return isSilver ? 'silver-text' : 'black';
		// 	});
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
		return (this.rectWidth + this.rectSpacingX) * this.getTreeOffset(brother) +
					(this.rectWidth / 2) * this.nthSameTreePledgeBro(brother);
	}
}