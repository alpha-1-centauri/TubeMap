"use strict";
const env = require('./../env.json'),
	React = require('react'),
	ReactDOM = require('react-dom'),
	PropTypes = require('proptypes'),
	$ = require('jquery');
global.jQuery = $;
global.Tether = require('tether');
require('bootstrap');
const mapboxgl = require('mapbox-gl'),
	data = require('./data.json');
class MainPage extends React.Component {
	constructor(props) {
		super(props);
		mapboxgl.accessToken = this.props.mapboxKey;
		this.state = {
			map: new mapboxgl.Map({
				container: 'map',
				style: 'mapbox://styles/mapbox/light-v9',
				attributionControl: false,
				center: [-0.127665, 51.507400],
				zoom: 3,
				minZoom: 1,
				dragRotate: false
			}).addControl(new mapboxgl.NavigationControl())
				.addControl(new mapboxgl.ScaleControl())
		}
	}
	
	render() {
		return (
			<div className="mapboxgl-control-container">
				<div className="mapboxgl-ctrl-top-left">
					<Search map={this.getMap()} stops={this.getStops()} />
				</div>
				<div className="mapboxgl-ctrl-bottom-right">
					<Key map={this.getMap()} stops={this.getStops()} lines={this.getLines()} />
				</div>
			</div>
		)
	}
	
	componentDidMount() {
		let mainPage = this;
		this.getMap().on('load', function() {
			mainPage.getLines().map(function(line) {
				line.stops.map(function(lineStops, i) {
					mainPage.getMap().addLayer({
						"id": line.id + "-" + i,
						"line": line.id,
						"type": "line",
						"source": {
							"type": "geojson",
							"data": {
								"type": "Feature",
								"properties": {},
								"geometry": {
									"type": "LineString",
									"coordinates": lineStops.map(function(item) {
										let stop = $.grep(mainPage.getStops(), function(e) {
											return e.id === item;
										})[0];
										return [stop.lon, stop.lat];
									})
								}
							}
						},
						"layout": {
							"line-cap": "round",
							"line-join": "round"
						},
						"paint": {
							"line-color": line.color,
							"line-width": 2
						}
					});
				});
			});
			const markerDiameter = 8;
			const markerBorder = 1;
			let minLon = mainPage.getStops()[0].lon;
			let maxLon = mainPage.getStops()[0].lon;
			let minLat = mainPage.getStops()[0].lat;
			let maxLat = mainPage.getStops()[0].lat;
			mainPage.getStops().map(function(stop) {
				let el = document.createElement('div');
				el.className = 'marker';
				el.style.backgroundColor = 'white';
				el.style.border = markerBorder + 'px solid black';
				el.style.borderRadius = '50%';
				el.style.overflow = 'hidden';
				el.style.cursor = 'pointer';
				el.style.width = markerDiameter + 'px';
				el.style.height = markerDiameter + 'px';
				el.title = stop.name;
				$(el).attr('data-toggle', 'tooltip');
				$(el).attr('data-placement', 'top');
				$(el).attr('data-stop', stop.id);
				new mapboxgl.Marker(el, {offset: [(-markerDiameter / 2) - markerBorder, (-markerDiameter / 2) - markerBorder]})
					.setLngLat([stop.lon, stop.lat])
					.addTo(mainPage.getMap());
				if(stop.lon < minLon) {
					minLon = stop.lon;
				}
				if(stop.lon > maxLon) {
					maxLon = stop.lon;
				}
				if(stop.lat < minLat) {
					minLat = stop.lat;
				}
				if(stop.lat > maxLat) {
					maxLat = stop.lat;
				}
			});
			$('[data-toggle="tooltip"]').tooltip();
			mainPage.getMap().fitBounds([[minLon, minLat], [maxLon, maxLat]], {
				padding: 75
			});
		});
	}
	
	getMap() {
		return this.state.map;
	}
	
	getLines() {
		return this.props.data.lines;
	}
	
	getStops() {
		return this.props.data.stops;
	}
}
MainPage.propTypes = {
	mapboxKey: PropTypes.string.isRequired,
	data: PropTypes.object.isRequired
};
class Search extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: '',
			results: []
		};
	}
	
	render() {
		return (
			<div className={"mapboxgl-ctrl" + ((this.getResultsCount() > 0) ? " results" : "")} id="search">
				<input className="form-control form-control-lg" type="text" value={this.state.value} title="Search" placeholder="Search" onChange={this.calcResults.bind(this)} />
				<ul className="search-results">
					{this.getSearchResults()}
				</ul>
			</div>
		);
	}
	
	calcResults(event) {
		let value = event.target.value;
		let results = this.getStops().filter(function(stop) {
			let query = value.toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/\s+/g, "-").trim();
			return stop.id.includes(query) && query.length > 1;
		});
		if(results.length > 8)
			results.splice(8, results.length - 8);
		this.setState({
			value: value,
			results: results
		})
	}
	
	selectResult(result) {
		this.getMap().flyTo({
			center: [result.lon, result.lat],
			zoom: 16
		});
		this.setState({
			value: result.name,
			results: []
		});
	}
	
	getSearchResults() {
		let search = this;
		return this.getResults().map(function(result, i) {
			return (
				<li key={i} onClick={search.selectResult.bind(search, result)}>{result.name}</li>
			);
		});
	}
	
	getResults() {
		return this.state.results;
	}
	
	getResultsCount() {
		return this.getResults().length;
	}
	
	getMap() {
		return this.props.map;
	}
	
	getStops() {
		return this.props.stops;
	}
}
Search.propTypes = {
	map: PropTypes.instanceOf(mapboxgl.Map).isRequired,
	stops: PropTypes.array.isRequired
};
class Key extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			expanded: false,
			selected: undefined
		}
	}
	
	render() {
		return (
			<div className={"mapboxgl-ctrl" + (this.getExpanded() ? " expanded" : "")} id="key">
				<ul id="lines">
					{this.getLineElements()}
				</ul>
				<div id="toggleButton" onClick={this.toggleExpanded.bind(this)}>
					<h5>Key</h5>
					<i className="material-icons" onClick={this.toggleExpanded.bind(this)}>{this.getExpanded() ? "keyboard_arrow_down" : "keyboard_arrow_up"}</i>
				</div>
			</div>
		);
	}
	
	getLineElements() {
		let key = this;
		if(this.getExpanded())
			return this.getLines().map(function(line, i) {
				const style = {
					backgroundColor: line.color
				};
				return (
					<li key={i} onClick={key.focusLine.bind(key, line)} onMouseEnter={key.setMapFilter.bind(key, line)} onMouseLeave={key.removeMapFilter.bind(key)}>
						<div className="line-indicator" style={style} />
						<h6>{line.name}</h6>
					</li>
				)
			});
	}
	
	toggleExpanded() {
		this.setState({
			expanded: !this.getExpanded()
		});
	}
	
	focusLine(line) {
		let key = this;
		let stops = [];
		line.stops.map(function(lineStops) {
			stops = stops.concat($.grep(key.getStops(), function(stop) {
				return lineStops.includes(stop.id);
			}));
		});
		let minLon = stops[0].lon;
		let maxLon = stops[0].lon;
		let minLat = stops[0].lat;
		let maxLat = stops[0].lat;
		stops.map(function(stop) {
			if(stop.lon < minLon) {
				minLon = stop.lon;
			}
			if(stop.lon > maxLon) {
				maxLon = stop.lon;
			}
			if(stop.lat < minLat) {
				minLat = stop.lat;
			}
			if(stop.lat > maxLat) {
				maxLat = stop.lat;
			}
		});
		this.getMap().fitBounds([[minLon, minLat], [maxLon, maxLat]], {
			padding: 75
		});
	}
	
	setMapFilter(line) {
		let key = this;
		this.getLineLayerNames().filter(function(lineLayer) {
			return !lineLayer.includes(line.id);
		}).map(function(lineLayer) {
			key.getMap().setFilter(lineLayer, ["==", "name", ""]);
		});
		$('.marker.mapboxgl-marker').css('display', 'none')
			.map(function() {
				let stop = this;
				line.stops.map(function(stops) {
					if(stops.includes($(stop).attr("data-stop")))
						$(stop).css('display', 'block');
				});
			});
	}
	
	removeMapFilter() {
		let key = this;
		this.getLineLayerNames().map(function(lineLayer) {
			key.getMap().setFilter(lineLayer, ["all"]);
		});
		$('.marker.mapboxgl-marker').css('display', 'block');
	}
	
	getLineLayerNames() {
		let names = [];
		this.getLines().map(function(line) {
			for(let i = 0; i < line.stops.length; i++) {
				names.push(line.id + "-" + i);
			}
		});
		return names;
	}
	
	getExpanded() {
		return this.state.expanded
	}
	
	getMap() {
		return this.props.map;
	}
	
	getStops() {
		return this.props.stops;
	}
	
	getLines() {
		return this.props.lines;
	}
}
Key.propTypes = {
	map: PropTypes.instanceOf(mapboxgl.Map).isRequired,
	stops: PropTypes.array.isRequired,
	lines: PropTypes.arrayOf(PropTypes.object).isRequired
};
ReactDOM.render(<MainPage mapboxKey={env.mapbox} data={data} />, $('#root')[0]);