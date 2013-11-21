// pixel adjustment
var delta = 0.0;

function drawLine(ctx, x1, y1, x2, y2, stl)
{
	ctx.save();
	ctx.strokeStyle = stl;
	ctx.beginPath();
	ctx.moveTo(x1 + delta, y1 + delta);
	ctx.lineTo(x2 + delta, y2 + delta);
	ctx.stroke();
	ctx.restore();
}

function drawPath(ctx, x0, y0, step, series, stl)
{
	ctx.save();
	ctx.strokeStyle = stl;
	ctx.beginPath();
	ctx.moveTo(x0 + delta, y0 - series[0] + delta);

	var x = x0;
	for (var i = 1; i < series.length; ++i) {
		ctx.lineTo(x + delta, y0 - series[i] + delta);
		x += step;
	}
	
	ctx.stroke();
	ctx.restore();
}

function drawArea(ctx, x0, y0, step, series, stl)
{
	ctx.save();
	ctx.strokeStyle = stl;
	ctx.fillStyle = stl;
	ctx.beginPath();
	ctx.moveTo(x0 + delta, y0 + delta);
	
	var x = x0;
	for (var i = 1; i < series.length; ++i) {
		ctx.lineTo(x + delta, y0 - series[i] + delta);
		x += step;
	}

	ctx.lineTo(x - step + delta, y0 + delta);
	ctx.closePath();
	ctx.stroke();
	ctx.fill();
	ctx.restore();
}

function saveRectangle(ctx, x, y, w, h)
{
	//return ctx.getImageData(x + delta, y + delta, w, h);
	return ctx.getImageData(x, y, w, h);
}

function restoreRectangle(ctx, x, y, imgData)
{
	//ctx.putImageData(imgData, x + delta, y + delta);
	ctx.putImageData(imgData, x, y);
}

function drawChartGroup(cgs, idx, id)
{
	var obj = document.getElementById(id);
	var ctx = obj.getContext("2d");

	ctx.gloalAlpha = 1.0;
	ctx.lineWidth = 1;

	var width = obj.width;
	var height = obj.height;
	var chart = cgs.charts[idx];
	
	var fwidth = width - cgs.padding_left - cgs.padding_right;
	var step =  fwidth / ((chart.end - chart.start) / chart.step);

	var colors = [ "red", "green", "black", "yellow" ];
	for (var i = 0; i < chart.series.length; ++i) {
		if (chart.series[i].type == "line") {
			drawPath(ctx, cgs.padding_left, height - cgs.padding_bottom, step, chart.series[i].fdata, colors[i]);
		}
		else {
			drawArea(ctx, cgs.padding_left, height - cgs.padding_bottom, step, chart.series[i].fdata, colors[i]);
		}
	}

	var title = chart.title;
	var legends = "";
	for (var i = 0; i < chart.series.length; ++i) {
		legends = legends + chart.series[i].lengend;
	}
	
	var tfont = "20px Arial";
	var theight = 20;
	var lfont = "15px Times New Roman";
	var lheight = 15;

	ctx.save();
	
	ctx.font = tfont;
	var twidth = ctx.measureText(title).width;
	
	ctx.font = lfont;
	var lwidth = ctx.measureText(legends).width;

	// add sample-lie and gap
	lwidth += 10 * chart.series.length + 5 * (chart.series.length - 1);
	// ctx.font?
	var fwidth = width - cgs.padding_left - cgs.padding_right;
	ctx.font = tfont;
	ctx.fillText(title, cgs.padding_left + (fwidth - twidth)/2, 10 + theight);
	
	var th = 10 + theight + 5 + lheight;
	var x = cgs.padding_left + (fwidth - lwidth) / 2;
	ctx.lineWidth = 2;
	for (var i = 0; i < chart.series.length; ++i) {
		drawLine(ctx, x, th - 5, x + 10, th - 5, colors[i]);
		ctx.font = lfont;
		ctx.fillText(chart.series[i].legend, x + 12, th);
		x += 10 + ctx.measureText(chart.series[i].legend).width + 5;
	}
	
	ctx.restore();
	
	drawLine(ctx, cgs.padding_left, cgs.padding_top, cgs.padding_left, height - cgs.padding_bottom, 'black');
	drawLine(ctx, cgs.padding_left, height - cgs.padding_bottom, width - cgs.padding_right, height - cgs.padding_bottom, 'black');
}

function getMouseXY(canvas, event)
{
	if (event.offsetX == undefined || event.offsetY == undefined) {
		if (event.layerX == undefined || event.layerY == undefined) {
			var bb = canvas.getBoundingClientRect();
			var xy = { "x": event.offsetX = event.pageX - bb.left - canvas.style.borderLeftWidth,
					   "y": event.pageY - bb.top - canvas.style.borderTopWidth
					 };

//			$("#history").html("<div>" + "clientXY:" + event.clientX + ", " + event.clientY
//							+ ", rect(left/top/w/h): " + bb.left + ", " + bb.top + ", " + bb.width +", " + bb.height
//							+ ", canvas.WH: " + canvas.width + ", " + canvas.height
//							+ ", <br>layerXY: " + event.layerX + ", " + event.layerY +"</div>");
			return xy;
		}
		else {
			return { "x": event.layerX, "y": event.layerY };
		}
	}
	else {
		return { "x": event.offsetX, "y": event.offsetY };
	}
}

function showStatusLine(cgs, idx, height, x)
{
	var ctx = document.getElementById(cgs.idprefix + idx).getContext("2d");
	var chart = cgs.charts[idx];

	// backup current line
	chart.savedLine = saveRectangle(ctx, x-1, cgs.padding_top, ctx.lineWidth+1, height - cgs.padding_top - cgs.padding_bottom);
	chart.savedX = x;
	chart.savedY = 0;
	chart.idx=idx;
	//$("#history").append("save:savedX["+idx+"]:"+chart.savedX+","+chart.savedY+","+chart.savedLine+",idx="+chart.idx+"<br>");
	// draw current line
	drawLine(ctx, x, cgs.padding_top, x, height - cgs.padding_bottom, 'rgba(255,0,0,1.0)');
}

function showPointStatus(cgs, idx, height, x)
{
	if (cgs.active_status_only) {
		showStatusLine(cgs, idx, height, x);
	}
	else {
		for (var i = 0; i < cgs.charts.length; ++i) {
			showStatusLine(cgs, i, height, x);
		}
	}
}

function hideStatusLine(cgs, idx)
{
	var ctx = document.getElementById(cgs.idprefix + idx).getContext("2d");
	var chart = cgs.charts[idx];
	//$("#history").append("restore:savedX["+idx+"]:"+chart.savedX+","+chart.savedY+","+chart.savedLine+",idx="+chart.idx+"<br>");
	if (!(chart.savedX == undefined || chart.savedY == undefined || chart.savedLine == undefined)) {
		restoreRectangle(ctx, chart.savedX-1, cgs.padding_top, chart.savedLine);
		//drawLine(ctx, chart.savedX, cgs.padding_top, chart.savedX, 290-cgs.padding_bottom, 'rgba(0,255,0,1.0)');
		chart.savedX = chart.savedY = chart.savedLine = null;
	}
}

function hidePointStatus(cgs, idx)
{
	if (cgs.active_status_only) {
		hideStatusLine(cgs, idx);
	}
	else {
		for (var i = 0; i < cgs.charts.length; ++i) {
			hideStatusLine(cgs, i);
		}
	}
}

function chartMouseMove(event)
{
	var cgs = event.data.cgs;
	var idx = event.data.idx;
	var chart = cgs.charts[idx];

	var pos = getMouseXY(this, event);
	var x = pos.x, y = pos.y;

	if (cgs.is_mouse_moving) {
		hidePointStatus(cgs, idx);
		cgs.is_mouse_moving = false;
	}

	if (x > cgs.padding_left && x <= (this.width - cgs.padding_right)) {
		cgs.is_mouse_moving = true;
		showPointStatus(cgs, idx, this.height, x);
	}

	if (false) {
		var msg = "Handler for .mousemove() called for " + this.id + " at ";
		msg +=    "page: " + event.pageX + ", " + event.pageY
		+ ". client: " + event.clientX + ", " + event.clientY
		+ ". layer: " + event.layerX + ", " + event.layerY
		+ ". screen: " + event.screenX + ", " + event.screenY
		+ ". offset: " + event.offsetX + ", " + event.offsetY
		+ ".old: " + this.oldX + ", " + this.oldY;
		$("#log").html("<div>" + msg + "</div>" + event);
		//$("#history").append("<div>" + msg + "</div>");
	}
}	

function chartMouseEnter(event)
{
	var cgs = event.data.cgs;
	var idx = event.data.idx;
	var chart = cgs.charts[idx];

	var pos = getMouseXY(this, event);
	var x = pos.x, y = pos.y;

	if (cgs.is_mouse_moving) {
		alert("why mouse is moving when mouse just enters");
		hidePointStatus(cgs, idx);
		cgs.is_mouse_moving = false;
	}

	if (x > cgs.padding_left && x <= (this.width - cgs.padding_right)) {
		cgs.is_mouse_moving = true;
		showPointStatus(cgs, idx, this.height, x);
	}
}

function chartMouseLeave(event)
{
	var cgs = event.data.cgs;
	var idx = event.data.idx;

	if (cgs.is_mouse_moving) {
			hidePointStatus(cgs, idx);
			cgs.is_mouse_moving = false;
	}
}

function calcSeriesMinMax(series)
{
	var min = series.data[0];
	var max = series.data[0];

	for (var i = 1; i < series.data.length; ++i) {
		if (series.data[i] < min) min = series.data[i];
		else if (series.data[i] > max) max = series.data[i];
	}
	
	series.rt_min = min;
	series.rt_max = max;
}

function calcChartMinMax(chart)
{
	chart.rt_left_axis_min = chart.rt_right_axis_min = DBL_MAX;
	chart.rt_left_axis_max = chart.rt_right_axis_max = DBL_MIN;
	chart.right_series = chart.left_series = 0;
		
	for (var j = 0; j < chart.series.length; ++j) {
		calcSeriesMinMax(chart.series[j]);
		if (chart.series[j].axis == "right") {
			++chart.right_series;
			if (chart.series[j].rt_min < chart.rt_right_axis_min)
				chart.rt_right_axis_min = chart.series[j].rt_min;
			if (chart.series[j].rt_max > chart.rt_right_axis_max)
				chart.rt_right_axis_max = chart.series[j].rt_max;
		}
		else {
			++chart.left_series;
			if (chart.series[j].rt_min < chart.rt_left_axis_min) chart.rt_left_axis_min = chart.series[j].rt_min;
			if (chart.series[j].rt_max > chart.rt_left_axis_max) chart.rt_left_axis_max = chart.series[j].rt_max;
		}
	}
}

function calcGroupMinMax(cgs)
{
	cgs.rt_left_axis_min = cgs.rt_right_axis_min = DBL_MAX;
	cgs.rt_left_axis_max = cgs.rt_right_axis_max = DBL_MIN;
	cgs.left_series = cgs.right_series = 0;
	
	for (var i = 0; i < cgs.charts.length; ++i) {
		var chart = cgs.charts[i];
		calcChartMinMax(chart);

		if (cgs.rt_left_axis_min > chart.rt_left_axis_min)
			cgs.rt_left_axis_min = chart.rt_left_axis_min;
		if (cgs.rt_left_axis_max < chart.rt_left_axis_max)
			cgs.rt_left_axis_max = chart.rt_left_axis_max;
		
		if (cgs.rt_right_axis_min > chart.rt_right_axis_min)
			cgs.rt_right_axis_min = chart.rt_right_axis_min;
		if (cgs.rt_right_axis_max < chart.rt_right_axis_max)
			cgs.rt_right_axis_max = chart.rt_right_axis_max;
		
		cgs.left_series += chart.left_series;
		cgs.right_series += chart.right_series;
	}
}

function autoAxisMinMax(min, max, gmin, gmax, rt_min, rt_max, rt_gmin, rt_gmax)
{
	var adjustMin = true, adjustMax = true;
	var rMin, rMax;
	
	if (min == "auto") { rMin = rt_min; }
	else if (min == "group-auto") { rMin = rt_gmin; }
	else { rMin = min; adjustMin = false; }
	
	if (max == "auto") { rMax = rt_max; }
	else if (max == "group-auto") { rMax = rt_gmax; }
	else { rMax = max; adjustMax = false; }

	var delta = rMax - rMin;
	if (adjustMin) {
		adjustedMin = rMin - delta / 10.0;
		if (rMin < 0) rMin = adjustedMin;
		else rMin = Math.max(adjustedMin, 0);
	}

	if (adjustMax) {
		adjustedMax = rMax + delta / 8.0;
		rMax = adjustedMax;
	}

	return { "min": rMin, "max":rMax };
}

function calcAxisMinMax(cgs, width, height)
{
	for (var i = 0; i < cgs.charts.length; ++i) {
		var chart = cgs.charts[i];
		if (chart.left_series > 0) {
			var mm = autoAxisMinMax(chart.left_axis_min, chart.left_axis_max,
									cgs.left_axis_min, cgs.left_axis_max,
			                        chart.rt_left_axis_min, chart.rt_left_axis_max,
			                        cgs.rt_left_axis_min, cgs.rt_left_axis_max);
			chart.rt_left_axis_min = mm.min;
			chart.rt_left_axis_max = mm.max;

			chart.rt_left_adjust = (height - cgs.padding_top - cgs.padding_bottom) / (mm.max - mm.min);
		}
		
		if (chart.right_series > 0) {
			var mm = autoAxisMinMax(chart.right_axis_min, chart.right_axis_max,
									cgs.right_axis_min, cgs.right_axis_max,
			                        chart.rt_right_axis_min, chart.rt_right_axis_max,
			                        cgs.rt_right_axis_min, cgs.rt_right_axis_max);
			chart.rt_right_axis_min = mm.min;
			chart.rt_right_axis_max = mm.max;

			chart.rt_right_adjust = (height - cgs.padding_left - cgs.padding_right) / (mm.max - mm.min);
		}
	}
}

function adjustGroup(cgs)
{
	for (var i = 0; i < cgs.charts.length; ++i) {
		var chart = cgs.charts[i];
		for (var j = 0; j < chart.series.length; ++j) {
			chart.series[j].fdata = new Array();
			for (var k = 0; k < chart.series[j].data.length; ++k) {
				if (chart.series[j].axis == "right") {
					chart.series[j].fdata[k] = (chart.series[j].data[k] - chart.rt_right_axis_min) * chart.rt_right_adjust;
				}
				else {
					chart.series[j].fdata[k] = (chart.series[j].data[k] - chart.rt_left_axis_min) * chart.rt_left_adjust;
				}
			}
		}
	}
}

function calcChartGroups(cgs, width, height)
{
	calcGroupMinMax(cgs);
	calcAxisMinMax(cgs, width, height);
	adjustGroup(cgs);
}

function installMouseHandler(id, cgs, idx)
{
	$("#" + id).bind("mouseenter", { "cgs": cgs, "idx": idx }, chartMouseEnter);
	$("#" + id).bind("mouseleave", { "cgs": cgs, "idx": idx }, chartMouseLeave);
	$("#" + id).bind("mousemove", { "cgs": cgs, "idx": idx }, chartMouseMove);
}

function drawChartGroups(idprefix, cgs, width, height)
{
	calcChartGroups(cgs, width, height);
	cgs.idprefix = idprefix;

	var html = "";
	for (var i = 0; i < cgs.charts.length; ++i) {
		html = html + "<div class=\"bf\"><canvas id=\"" + idprefix + i
				    + "\" class=\"f\" width=\"" + width
					+ "\" height=\"" + height
					+ "\"></canvas></div><br>";
	}

	$("#" + idprefix).html(html);

	for (var i = 0; i < cgs.charts.length; ++i) {
		drawChartGroup(cgs, i, idprefix+i);
		installMouseHandler(idprefix+i, cgs, i);		
	}

	return;
}