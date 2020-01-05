// Source: https://campuscard.umbc.edu/meal-plans-2/meal-plans/
const MEAL_EQUIVALENCE = 6.40;
const DHALL_BREAKFAST = 7.50;
const DHALL_LUNCH = 10.85;
const DHALL_DINNER = 11.90;

const app = angular.module("meal-breakdown", ["ngRoute", "chart.js"]);

/**
* Handle application routing so that it is all in one page.
*/
app.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
    // don't anything in front of hash
    $locationProvider.hashPrefix('');

    // handle URL routing as a Single Page Application
    $routeProvider
        .when("/", {
            title: "Meal Breakdown",
            templateUrl: "templates/home.html",
            controller: 'HomeCtrl'
        })
        .when("/analytics", {
            title: "Analytics",
            templateUrl: "templates/analytics.html",
            controller: 'AnalyticsCtrl'
        })
        .otherwise({
            redirectTo: "/"
        });
}]);

/**
* Display the title based on whatever route it's on.
*/
app.run(['$rootScope', function ($rootScope) {
    // when the route changes
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        // change the page title variable to new route title
        $rootScope.title = current.$$route.title;
    });
}]);


/**
* https://stackoverflow.com/questions/17922557/angularjs-how-to-check-for-changes-in-file-input-fields/17923521#17923521
*/
app.directive('customOnChange', function() {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            let onChangeHandler = scope.$eval(attrs.customOnChange);

            element.on('change', onChangeHandler);

            element.on('$destroy', () => {
                element.off();
            });
        }
    };
});

/**
* Handle Home Page logic.
*/
app.controller("HomeCtrl", function ($rootScope, $scope, $location) {
    /**
    * Upload CSV file and proccess
    */
    $scope.uploadFile = (event) => {
        // get files from change event
        let files = event.target.files;

        // if there is a file attached to input
        if (files.length) {
            // read the file input
            let reader = new FileReader();
            reader.readAsBinaryString(files[0]);

            // TODO Delineate from Flex and Meal Usage

            // when the reader loads the data
            reader.onload = function (e) {
                // get the data from the event and convert into JSON
                $rootScope.csvData = e.target.result;
                $rootScope.csvData = Papa.parse($rootScope.csvData);
                $rootScope.csvData = $rootScope.csvData.data;

                // remove the first array element (the data headers)
                $rootScope.csvData.shift();
                $rootScope.csvData.pop();
            };
        }
    };

    /**
    * Go to the analytics page.
    */
    $scope.goToAnalytics = () => {
        $location.path("/analytics");
    }
});

/**
* Handle Analytics Page logic.
*/
app.controller("AnalyticsCtrl", function ($rootScope, $scope, $location) {
    $scope.venues = {};
    $scope.totalMeals = 0;
    $scope.totalCost = 0;

    $scope.chartOptions = {
        scales: {
            xAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    };

    $scope.mealPeriods = ['Breakfast', 'Lunch', 'Dinner', 'Late Night', 'N/A'];
    $scope.daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    /**
    * Go to the home page.
    */
    $scope.analyzeAnother = () => {
        $location.path("/");
    }

    // if csv data is defined
    if ($rootScope.csvData) {
        // set start and end date of the data from csv file
        $scope.startDate = new Date($rootScope.csvData[$rootScope.csvData.length - 1][0].split(" ")[0]);
        $scope.endDate = new Date($rootScope.csvData[0][0].split(" ")[0]);

        // go through every meal
        for (let meal of $rootScope.csvData) {
            let mealDateTime = meal[0];
            let mealVenue = meal[1];

            // if meal venue is defined
            if (mealVenue && !mealVenue.includes("Patron")) {
                // keep only venue name from csv data
                if (mealVenue.includes("2. MATO"))
                    mealVenue = "2.MATO";
                else
                    mealVenue = mealVenue.substring(0, mealVenue.search("[\\d]") - 1);

                // if meal venue already has an array that is tracking it
                if (mealVenue in $scope.venues)
                    $scope.venues[mealVenue]["mealData"].push(meal);
                // if is first occurence of meal venue
                else {
                    $scope.venues[mealVenue] = {"mealData": [meal]};
                    $scope.venues[mealVenue].dayOfWeekBreakdown = [];
                }
                    
                // add to running total of meals used
                $scope.totalMeals++;

                // get meal period of swipe
                let timeSplit = mealDateTime.split(" ")[1];
                let mealPeriod = getMealPeriod(timeSplit);

                // keep track of total venue meal swipes during particular meal period
                if (mealPeriod in $scope.venues[mealVenue])
                    $scope.venues[mealVenue][mealPeriod]++;
                else
                    $scope.venues[mealVenue][mealPeriod] = 1;

                // keep track of total venue meanl swipes on particular day of week
                let day = new Date(mealDateTime.split(" ")[0]).getDay();
                if ($scope.venues[mealVenue].dayOfWeekBreakdown[day])
                    $scope.venues[mealVenue].dayOfWeekBreakdown[day]++;
                else 
                    $scope.venues[mealVenue].dayOfWeekBreakdown[day] = 1;

                // if ($scope.venues[mealVenue].dayOfWeekBreakdown[$scope.daysOfWeek[day]][mealPeriod])
                //     $scope.venues[mealVenue].dayOfWeekBreakdown[$scope.daysOfWeek[day]][mealPeriod]++;
                // else
                //     $scope.venues[mealVenue].dayOfWeekBreakdown[$scope.daysOfWeek[day]][mealPeriod] = 1

                // if the venue doesn't have a total sum yet
                if (!$scope.venues[mealVenue].venueTotal)
                    $scope.venues[mealVenue].venueTotal = 0;

                // if dhall, use cost equivalency depending on meal period
                if (mealVenue == "TRUE GRITS") {
                    switch (mealPeriod) {
                        case "Breakfast":
                            $scope.totalCost += DHALL_BREAKFAST;
                            $scope.venues[mealVenue].venueTotal += DHALL_BREAKFAST;
                            break;
                        case "Lunch":
                            $scope.totalCost += DHALL_LUNCH;
                            $scope.venues[mealVenue].venueTotal += DHALL_LUNCH;
                            break;
                        case "Dinner":
                            $scope.totalCost += DHALL_DINNER;
                            $scope.venues[mealVenue].venueTotal += DHALL_DINNER;
                            break;
                        case "Late Night":
                            $scope.totalCost += MEAL_EQUIVALENCE;
                            $scope.venues[mealVenue].venueTotal += MEAL_EQUIVALENCE;
                            break;
                    }
                }
                // if other venue, just use meal equivalence from campus card
                else {
                    $scope.totalCost += MEAL_EQUIVALENCE;
                    $scope.venues[mealVenue].venueTotal += MEAL_EQUIVALENCE;
                }
            }

            console.log($scope.venues)
        }

        // Format data for d3
        let dataset = { "children": [] };
        $scope.venueTotals = [];

        for (let venue in $scope.venues) {
            // push children nodes into dataset for bubbleChart
            dataset.children.push({ "venueId": venue, mealCount: $scope.venues[venue].mealData.length });

            // compile all the venue meal period totals into one array
            $scope.venues[venue].mealPeriodBreakdown = [
                $scope.venues[venue]["Breakfast"] || 0,
                $scope.venues[venue]["Lunch"] || 0,
                $scope.venues[venue]["Dinner"] || 0,
                $scope.venues[venue]["Late Night"] || 0,
                $scope.venues[venue]["N/A"] || 0,
            ];
        }

        makeBubbleChart(dataset);
    };

    // TODO Switch this logic to moment code
    function getMealPeriod(timeSplit) {
        // Breakfast 6am - 10am
        if (timeSplit.includes("AM") && [6, 7, 8, 9, 10].includes(parseInt(timeSplit.split(":")[0])))
            return "Breakfast";
        // Lunch 11am - 4pm
        else if ((timeSplit.includes("AM") && parseInt(timeSplit.split(":")[0]) == 11)
            || (timeSplit.includes("PM") && [12, 1, 2, 3, 4].includes(parseInt(timeSplit.split(":")[0]))))
            return "Lunch";
        // If time is after noon and after 4pm and before 8pm it is dinner
        else if ((timeSplit.includes("PM")) && [4, 5, 6, 7, 8].includes(parseInt(timeSplit.split(":")[0])))
            return "Dinner"
        // Otherwise it is late night
        else if ((timeSplit.includes("PM") && [9, 10, 11].includes(parseInt(timeSplit.split(":")[0])))
            || (timeSplit.includes("AM") && [12, 1, 2].includes(parseInt(timeSplit.split(":")[0]))))
            return "Late Night";
        else
            return "N/A";
    }

    function makeBubbleChart(dataset) {
        document.getElementById("bubbleChart").innerHTML = "";

        // Create the D3 Chart
        let diameter = 1000;
        let color = d3.scaleOrdinal(d3.schemeCategory10);

        // Create bubble object
        let bubble = d3.pack(dataset)
            .size([window.innerWidth, diameter])
            .padding(1.5);

        // Create an svg inside the bubble chart div
        let svg = d3.select("#bubbleChart")
            .append("svg")
            .attr("width", window.innerWidth)
            .attr("height", diameter)
            .attr("class", "bubble");

        let nodes = d3.hierarchy(dataset)
            .sum(function (d) { return d.mealCount; });

        let node = svg.selectAll(".node")
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
});