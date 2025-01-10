import * as a1lib from "alt1";
import "./index.html";
import "./appconfig.json";
import "./css/style.css";
import "./icon.png";
import {StarData} from "./types/StarData";
import isEqual from "lodash/isEqual";

const BASE_URL ="https://api.starfind.net"

const tableContent = document.getElementById("table-body") as HTMLElement;
let previousData: StarData[] | null = null;

function calculateRemainingTime(time: Date): string {
    const now = new Date();
    const diffMs = time.getTime() - now.getTime();

    if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
        return "Expired";
    }
}

function messageRow(textContent: string) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = textContent;
    tr.appendChild(td);
    return tr;
}

async function fetchAndDisplayData() {
    try {
        const response = await fetch(`${BASE_URL}/api/waves/current`);
        if (!response.ok) {
            throw new Error("Failed to fetch the data.");
        }
        const responseData = await response.json();
        const data: StarData[] = responseData.stars.map((item: StarData) => {
            const time = new Date(item.time * 1000);
            return {
                world: {
                    number: item.world.number,
                    type: item.world.type
                },
                location: item.location,
                size: item.size,
                dropTime: time.toLocaleString(),
                timeUntillDrop: calculateRemainingTime(time)
            };
        });

        if (!isEqual(data, previousData)) {
            previousData = data;
            displayTable(data);
        }
    } catch (error) {
        tableContent.innerHTML = "";
        tableContent.appendChild(messageRow("Error fetching data."));
    }
}

function displayTable(data: StarData[]) {
    if (!data.length) {
        tableContent.innerHTML = "";
        tableContent.appendChild(messageRow("No stars scoped in the current wave yet."));
        return;
    }
    data.forEach((row: Record<string,any>) => {
        const tr = document.createElement("tr");

        Object.entries(row).forEach(([key, value]) => {
            let td = document.createElement("td");

            if(key == "world"){
                td.textContent = value.number;
                const icon = document.createElement("img");
                icon.classList.add("icon-size");
                if (row.world.type.toUpperCase() === "F2P") {
                    icon.src = "https://runescape.wiki/images/F2P_icon.png";
                } else {
                    icon.src = "https://runescape.wiki/images/P2P_icon.png";
                }
                td.prepend(icon);
            } else {
                td.textContent = value;
            }
            tr.appendChild(td);
        });
        tableContent.appendChild(tr);
    });

}

fetchAndDisplayData();
setInterval(fetchAndDisplayData, 150000);

if (window.alt1) {
    alt1.identifyAppUrl("./appconfig.json");
} else {
    let addappurl = `alt1://addapp/${new URL("./appconfig.json", document.location.href).href}`;
    let newEle = `<li>Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1</li>`;
    let alt1warning = document.getElementById("alt1warning") as HTMLElement;
    alt1warning.insertAdjacentHTML("beforeend", newEle);
}
