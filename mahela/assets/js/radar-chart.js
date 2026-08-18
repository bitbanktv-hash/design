/**
 * MahtELA radar (spider) chart. Pure SVG, no charting library.
 * Usage: MahtelaRadar.render(containerEl, {
 *   labels: ['Listening','Speaking','Reading','Writing'],
 *   values: [80, 65, 90, 55],   // 0-100
 *   color: '#F478B0'
 * });
 */
( function () {
	'use strict';

	var SIZE = 300;
	var CENTER = SIZE / 2;
	var MAX_R = 105;
	var RINGS = [ 0.25, 0.5, 0.75, 1 ];

	function polarPoint( angleDeg, r ) {
		var rad = ( angleDeg - 90 ) * ( Math.PI / 180 );
		return { x: CENTER + r * Math.cos( rad ), y: CENTER + r * Math.sin( rad ) };
	}

	function pointsAttr( points ) {
		return points.map( function ( p ) { return p.x.toFixed( 2 ) + ',' + p.y.toFixed( 2 ); } ).join( ' ' );
	}

	function ns( tag ) { return document.createElementNS( 'http://www.w3.org/2000/svg', tag ); }

	function render( container, options ) {
		var labels = options.labels || [];
		var values = options.values || [];
		var color = options.color || 'var(--brand)';
		var n = labels.length;
		if ( n < 3 ) { return; }

		var angleStep = 360 / n;

		var svg = ns( 'svg' );
		svg.setAttribute( 'viewBox', '0 0 ' + SIZE + ' ' + SIZE );
		svg.setAttribute( 'class', 'radar-chart' );
		svg.setAttribute( 'role', 'img' );
		svg.setAttribute( 'aria-label', labels.map( function ( l, i ) { return l + ': ' + values[ i ]; } ).join( ', ' ) );

		var gridGroup = ns( 'g' );
		gridGroup.setAttribute( 'class', 'radar-chart__grid' );

		// Concentric rings
		RINGS.forEach( function ( ringFrac, ringIndex ) {
			var pts = [];
			for ( var i = 0; i < n; i++ ) {
				pts.push( polarPoint( i * angleStep, MAX_R * ringFrac ) );
			}
			var poly = ns( 'polygon' );
			poly.setAttribute( 'points', pointsAttr( pts ) );
			poly.setAttribute( 'class', 'radar-chart__ring' );
			poly.style.transitionDelay = ( ringIndex * 60 ) + 'ms';
			gridGroup.appendChild( poly );
		} );

		// Axis lines + labels
		for ( var i = 0; i < n; i++ ) {
			var outer = polarPoint( i * angleStep, MAX_R );
			var line = ns( 'line' );
			line.setAttribute( 'x1', CENTER ); line.setAttribute( 'y1', CENTER );
			line.setAttribute( 'x2', outer.x ); line.setAttribute( 'y2', outer.y );
			line.setAttribute( 'class', 'radar-chart__axis' );
			gridGroup.appendChild( line );

			var labelPos = polarPoint( i * angleStep, MAX_R + 26 );
			var text = ns( 'text' );
			text.setAttribute( 'x', labelPos.x );
			text.setAttribute( 'y', labelPos.y );
			text.setAttribute( 'class', 'radar-chart__label' );
			text.setAttribute( 'text-anchor', 'middle' );
			text.setAttribute( 'dominant-baseline', 'middle' );
			text.textContent = labels[ i ];
			gridGroup.appendChild( text );
		}

		svg.appendChild( gridGroup );

		// Data polygon: points are set to their FINAL target immediately;
		// the draw-in effect comes from animating transform:scale(0 -> 1)
		// via CSS, which is reliably transitionable (unlike animating the
		// `points` attribute directly, which browsers handle inconsistently).
		var dataPts = [];
		for ( var j = 0; j < n; j++ ) {
			var r = Math.max( 0, Math.min( 100, values[ j ] || 0 ) ) / 100 * MAX_R;
			dataPts.push( polarPoint( j * angleStep, r ) );
		}

		var dataPoly = ns( 'polygon' );
		dataPoly.setAttribute( 'points', pointsAttr( dataPts ) );
		dataPoly.setAttribute( 'class', 'radar-chart__data' );
		dataPoly.style.setProperty( '--radar-color', color );
		svg.appendChild( dataPoly );

		// Vertex dots
		var dotsGroup = ns( 'g' );
		dataPts.forEach( function ( p, i ) {
			var dot = ns( 'circle' );
			dot.setAttribute( 'cx', p.x ); dot.setAttribute( 'cy', p.y );
			dot.setAttribute( 'r', 5 );
			dot.setAttribute( 'class', 'radar-chart__dot' );
			dot.style.setProperty( '--radar-color', color );
			dot.style.transitionDelay = ( 350 + i * 70 ) + 'ms';
			dotsGroup.appendChild( dot );
		} );
		svg.appendChild( dotsGroup );

		container.innerHTML = '';
		container.appendChild( svg );

		// Trigger the draw-in animation on the next frame.
		requestAnimationFrame( function () {
			requestAnimationFrame( function () {
				svg.classList.add( 'is-drawn' );
			} );
		} );

		return svg;
	}

	window.MahtelaRadar = { render: render };
}() );
