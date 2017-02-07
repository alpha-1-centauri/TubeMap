"use strict";
let env = require('./../env.json');
let React = require('react');
let ReactDOM = require('react-dom');
let $ = require('jquery');
global.jQuery = $;
global.Tether = require('tether');
require('bootstrap');
let mapboxgl = require('mapbox-gl');
let data = require('./data.json');
class MainPage extends React.Component {
	constructor(props) {
		super(props);
		mapboxgl.accessToken = env.mapbox;
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
				.addControl(new mapboxgl.ScaleControl()),
			lines: data.lines,
			stops: data.stops
		}
	}
	
	render() {
		return (
			<div className="mapboxgl-control-container">
				<div className="mapboxgl-ctrl-top-left">
					<Search map={this.getMap()} stops={this.getStops()} />
				</div>
			</div>
		)
	}
	
	componentDidMount() {
		let mainPage = this;
		this.getMap().on('load', function() {
			mainPage.getLines().map(function(line, i) {
				mainPage.getMap().addLayer({
					"id": i + "-" + line.name,
					"type": "line",
					"source": {
						"type": "geojson",
						"data": {
							"type": "Feature",
							"properties": {},
							"geometry": {
								"type": "LineString",
								"coordinates": line.stops.map(function(item) {
									let stop = $.grep(mainPage.getStops(), function(e) {
										return e.id == item;
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
		return this.state.lines;
	}
	
	getStops() {
		return this.state.stops;
	}
}
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
			<div className="mapboxgl-ctrl">
				<input className={"form-control form-control-lg" + ((this.getResultsCount() > 0) ? " results" : "")} type="text" value={this.state.value} title="Search" placeholder="Search" onChange={this.calcResults.bind(this)} />
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
ReactDOM.render(<MainPage />, $('#root')[0]);