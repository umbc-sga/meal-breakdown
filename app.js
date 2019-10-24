/* Add event listeners to toggle the chevrons on collapse changes */
$(document).ready(function () {
    // Mobile detection
    if (navigator.userAgent.indexOf("Mobi") != -1)
        alert("Are you on a mobile device? This application requires that you download a file, a feature not available on all phones.");

    // Chevron Toggle 
    function toggleChevron(e) {
        $(e.target)
            .prev(".card-header")
            .find("i.fa")
            .toggleClass("rotate-down rotate-up");
    }

    // Toggle Chevrons
    $("#venueAccordion").on("hide.bs.collapse", toggleChevron);
    $("#venueAccordion").on("show.bs.collapse", toggleChevron);
});

/* Get file contents from a file form field */
function getFile() {
    // Get file upload form element
    var file = document.getElementById('fileUpload');

    // If the file is defined
    if (file.files.length) {
        // Read the file input
        var reader = new FileReader();
        reader.readAsBinaryString(file.files[0]);

        // When the reader load the data
        reader.onload = function (e) {
            // Get the data from the event
            var csv = e.target.result;

            // Analyze the data
            analyzeData(csv);
        };
    }
}

function reset() {
    // Reset file
    document.getElementById('fileUpload').value = "";

    // Show submission and hide analytics
    document.getElementById("submission").style.display = "";
    document.getElementById("analytics").style.display = "none";
}

function makeBubbleChart(dataset) {
    // Create the D3 Chart
    var diameter = 1000;
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create bubble object
    var bubble = d3.pack(dataset)
        .size([diameter, diameter])
        .padding(1.5);

    // Create an svg inside the bubble chart div
    var svg = d3.select("#bubbleChart")
        .append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

    var nodes = d3.hierarchy(dataset)
        .sum(function (d) { return d.mealCount; });

    var node = svg.selectAll(".node")
        .data(bubble(nodes).descendants())
        .enter()
        .filter(function (d) {
            return !d.children
        })
        .append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    node.append("title")
        .text(function (d) {
            return d.data.venueId + ": " + d.data.mealCount;
        });

    node.append("circle")
        .attr("r", function (d) {
            return d.r;
        })
        .style("fill", function (d) {
            return color(Math.random());
        });

    node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function (d) {
            return d.data.venueId.substring(0, d.r / 3);
        });

    d3.select(self.frameElement)
        .style("height", diameter + "px");
}

/* Parse the CSV and analyze dining data */
function analyzeData(csv) {
    // Get meals data from CSV to array format
    let data = Papa.parse(csv);
    data = data.data;

    // Remove the first array element (the data headers)
    data.shift();
    data.pop();

    console.log(data);

    // JSON to store sorted restaurant entries
    let venues = {};

    // Go through every single meal in records
    for (let meal of data) {
        let mealDateTime = meal[0];
        let mealVenue = meal[1];

        console.log(mealVenue)

        // if meal venue is defined
        if (mealVenue) {
            // keep only venue
            if (mealVenue.includes("2. MATO"))
                mealVenue = "2.MATO";
            else
                mealVenue = mealVenue.substring(0, mealVenue.search("[\\d]") - 1);

            // if meal venue already has an array that is tracking it
            if (mealVenue in venues)
                venues[mealVenue].push(meal);
            // if is first occurence of meal venue
            else
                venues[mealVenue] = [meal];
        }
    }

    let analytics = document.getElementById("analytics");

    // Hide submission and show analytics page
    document.getElementById("submission").style.display = "none";
    analytics.style.display = "";

    let totalMeals = 0;

    // Make collapses for data
    let numVenues = Object.keys(venues).length;
    let myVenues = Object.keys(venues);

    for (var i = 0; i < numVenues; i++) {
        // Get the venue name to use as a key from possible venues array
        let venue = myVenues[i];

        // Store venue breakdowns
        let mealPeriods = { "Breakfast": [], "Lunch": [], "Dinner": [], "Late Night": [] };
        let weekDays = { "Sunday": [], "Monday": [], "Tuesday": [], "Wednesday": [], "Thursday": [], "Friday": [], "Saturday": [] };

        // Create card div
        let card = document.createElement("DIV");
        card.className = "card";

        // Create card header div
        let cardHeader = document.createElement("DIV");
        cardHeader.className = "card-header";
        cardHeader.id = "heading" + i;
        cardHeader.setAttribute("data-toggle", "collapse");
        cardHeader.setAttribute("data-target", "#collapse" + i);
        cardHeader.setAttribute("aria-expanded", "false");
        cardHeader.setAttribute("aria-controls", "collapse" + i);

        // Create title heading for card
        let heading = document.createElement("H5");
        heading.className = "mb-0";

        // Create button which is the actual text of the card heading
        let headingButton = document.createElement("BUTTON");
        headingButton.className = "btn btn-link";
        headingButton.innerHTML = venue + ": " + venues[venue].length;

        // Create chevron that will be in the card header next to the title
        let chevron = document.createElement("I");
        chevron.className = "fa fa-chevron-down";

        // Add the heading button and chevron to the header
        heading.appendChild(headingButton);
        heading.appendChild(chevron);

        // Add the heading to the card header
        cardHeader.appendChild(heading);

        // Create collapse for the card
        let collapse = document.createElement("DIV");
        collapse.id = "collapse" + i;
        collapse.className = "collapse";
        collapse.setAttribute("aria-labelledby", "heading" + i);
        collapse.setAttribute("data-parent", "#accordion");

        // Create card body
        let cardBody = document.createElement("DIV");
        cardBody.className = "card-body";

        // Create row for the different stat breakdowns
        let row = document.createElement("DIV");
        row.className = "row";

        // Create column for list of times you've eaten at the venue
        let listColumn = document.createElement("DIV");
        listColumn.className = "col-sm-4";

        // Create the numbered list of times you've eaten at the venue
        let list = document.createElement("OL");

        // Go through every meal purchase and add to list
        for (let entry of venues[venue]) {
            totalMeals++;

            // Split the existing time format
            let mealDateTime = entry[0];
            let dateSplit = mealDateTime.split(" ")[0];
            let timeSplit = mealDateTime.split(" ")[1];

            // Breakfast 6am - 10am
            if (timeSplit.includes("AM") && [6, 7, 8, 9, 10].includes(parseInt(timeSplit.split(":")[0])))
                mealPeriods["Breakfast"].push(entry);
            // Lunch 11am - 2pm
            else if ((timeSplit.includes("AM") && parseInt(timeSplit.split(":")[0]) == 11)
                || (timeSplit.includes("PM") && [12, 1, 2].includes(parseInt(timeSplit.split(":")[0]))))
                mealPeriods["Lunch"].push(entry);
            // If time is after noon and after 4pm and before 8pm it is dinner
            else if ((timeSplit.includes("PM")) && [4, 5, 6, 7, 8].includes(parseInt(timeSplit.split(":")[0])))
                mealPeriods["Dinner"].push(entry);
            // Otherwise it is late night
            else if ((timeSplit.includes("PM") && [9, 10, 11].includes(parseInt(timeSplit.split(":")[0])))
                || (timeSplit.includes("AM") && [12, 1, 2].includes(parseInt(timeSplit.split(":")[0]))))
                mealPeriods["Late Night"].push(entry)

            // Convert the date to moment object
            var finalDate = moment(dateSplit);

            // Add hours and strip AM/PM
            var hours = parseInt(timeSplit.split(":")[0]);
            if (timeSplit.includes("PM")) {
                // Add 12 hours since its PM
                if (hours != 12) hours += 12;

                timeSplit.replace("PM", "");
            }
            else
                timeSplit.replace("AM", "");

            // Get minutes
            var minutes = parseInt(timeSplit.split(":")[1]);

            // Add the hour and minutes to the date
            finalDate = moment(finalDate).add(hours, "hours");
            finalDate = moment(finalDate).add(minutes, "minutes");

            // Add the formatted date to the card
            var dateOutputString = moment(finalDate).format("dddd, MMMM Do, YYYY - h:mma");

            // Get the weekday
            var weekDay = dateOutputString.split(",")[0];
            weekDays[weekDay].push(entry);

            // Add list item to list
            var listItem = document.createElement("LI");
            listItem.innerHTML = dateOutputString;
            list.appendChild(listItem);
        }

        // Add list to list column
        listColumn.appendChild(list);

        // Create column to hold meal period stat breakdown
        var mealPeriodColumn = document.createElement("DIV");
        mealPeriodColumn.className = "col-sm-4";

        // Add meal period breakdown stats
        for (var mealPeriod in mealPeriods) {
            var mealPeriodHeading = document.createElement("H5");

            if (mealPeriods[mealPeriod].length > 0)
                mealPeriodHeading.innerHTML = mealPeriod + ": " + mealPeriods[mealPeriod].length + " (" + ((mealPeriods[mealPeriod].length / venues[venue].length) * 100).toFixed(1) + "%)";
            else
                mealPeriodHeading.innerHTML = mealPeriod + ": 0 (0%)";

            mealPeriodColumn.appendChild(mealPeriodHeading);
        }

        // Create column to hold weekday stat breakdown
        var weekDayColumn = document.createElement("DIV");
        weekDayColumn.className = "col-sm-4";

        // Add week day breakdown stats
        for (var weekDay in weekDays) {
            var weekDayHeading = document.createElement("H5");

            if (weekDays[weekDay].length > 0)
                weekDayHeading.innerHTML = weekDay + ": " + weekDays[weekDay].length + " (" + ((weekDays[weekDay].length / venues[venue].length) * 100).toFixed(1) + "%)";
            else
                weekDayHeading.innerHTML = weekDay + ": 0 (0%)";

            weekDayColumn.appendChild(weekDayHeading);
        }

        // Add columns to the row
        row.appendChild(listColumn);
        row.appendChild(mealPeriodColumn);
        row.appendChild(weekDayColumn);

        // Add the row to the card body
        cardBody.appendChild(row);

        // Add the card header 
        card.appendChild(cardHeader);

        // Add card body into collapse and add to card
        collapse.appendChild(cardBody);
        card.appendChild(collapse);

        // Add the card into the collapse
        card.appendChild(collapse);

        // Add the collapse into the accordion
        document.getElementById("venueAccordion").appendChild(card);
    }

    // Display how many meals the user has eaten
    $("#venueAccordion").prepend("<h3 id='totalMealsHead' class='mb-3'> Total Meals Used: " + totalMeals + "</h3>");
    
    // for (var meal of data) {
    //     var dateTime = meal[0];

    //     if (dateTime) {
    //         console.log(moment(dateTime));
    //     }
    // }

    // Format data for d3
    var dataset = { "children": [] };
    for (var venue in venues)
        dataset.children.push({ "venueId": venue, mealCount: venues[venue].length });

    makeBubbleChart(dataset);
}
