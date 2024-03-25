let url = `https://01.kood.tech/api/graphql-engine/v1/graphql`;
let uname = "Raigo";
let imageLink = `https://01.kood.tech/git/user/avatar/${uname}/-1`;
let uid;
let time;
let sin = document.getElementById("sin");
let sbtn = document.getElementById("sbtn");
let doneDat;
let times = [];
let off = 0;
let gxp = 0;
let prxp = [];
let prxpadded = [];
let doneName = [];
sbtn.addEventListener("click", () => {
  uGet(sin.value);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    uGet(sin.value);
  }
});
async function main() {
  showUdata();
  await getXp();
  showUlvl();
  showXpPrOt();
}
function CLEAR() {
  doneDat = [];
  times = [];
  off = 0;
  gxp = 0;
  prxp = [];
  prxpadded = [];
  doneName = [];
}
function xpToLevel(xp) {
  let l = 0;
  while (xpForLevel(++l) < xp) {}
  return l - 1;
}
function xpForLevel(l) {
  return Math.round(l * (176 + 3 * l * (47 + 11 * l)));
}
function xpLevelUp(xp) {
  return xpForLevel(xpToLevel(xp) + 1) - xp;;
}
function xpCurLevel(xp) {
  return xp - xpForLevel(xpToLevel(xp));
}
async function uGet(inp) {
  let v = inp;
  if (v && v.trim().length > 0) {
    v = v.trim();
  } else {
    alert("No input")
    return;
  }
  let r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `query ($username: String ) {
        user(where: {login: { _eq: $username } }) {
          id
        }
      }`,
      variables: {
        username: v,
      },
    }),
  });
  let data = await r.json();
  data = data.data.user;
  if (data.length == 0) {
    alert("Username doesn't exist")
    return;
  }
  uname = v;
  CLEAR();
  main();
}
async function uIdTime() {
  let r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `query ($username: String ) {
        user(where: {login: { _eq: $username } }) {
          id
    			progresses (limit: 1, order_by: {createdAt: desc}) {
            object {
              name
            }
      		createdAt
          }
    			
        }
      }`,
      variables: {
        username: uname,
      },
    }),
  });
  let data = await r.json();
  uid = data.data.user[0].id;
  time = data.data.user[0].progresses[0].createdAt;
  time = time.slice(0, 10);
  time = time.slice(8) + "/" + time.slice(5, 7) + "/" + time.slice(0, 4);
}
async function getDone() {
  let r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `query ($username: String ) {
        progress(
          where: {_and: [{user: {login: {_eq: $username}}},
            {_or: [{object: {type: {_eq: "project"}}}, {object: {type: {_eq: "piscine"}}}]},
            {isDone: {_eq: true}}]},
          order_by: {updatedAt: asc},
          offset: 1
        ) {
          object {
            id
            name
            type
          }
          updatedAt
          user {
            login
          }
          isDone
          path
        }
      }`,
      variables: {
        username: uname,
      },
    }),
  });
  let data = await r.json();
  doneDat = data.data.progress;
  for (let i = 0; i < doneDat.length; i++) {
    times.push(doneDat[i].updatedAt);
  }
}
async function getXp() {
  await getDone();
  for (let i = 0; i < doneDat.length; i++) {
    let pname = doneDat[i].object.name;
    let r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: `query ($projectNameVar: String, $username: String ) {
          transaction(
            where: {_and: [{user: {login: {_eq: $username}}},
            {object: {name: {_eq: $projectNameVar}}},
            ]},
            order_by: {amount: desc},
            limit: 1) {
            object {
              name
            }
            user {login}
            userId
            amount
            createdAt
          }
        }`,
        variables: {
          username: uname,
          projectNameVar: pname,
        },
      }),
    });
    let data = await r.json();
    gxp += data.data.transaction[0].amount;
    if (i == 0) {
      prxpadded.push(data.data.transaction[0].amount);
    } else {
      prxpadded.push(
        prxpadded[i - 1] + data.data.transaction[0].amount
      );
    }
    prxp.push(data.data.transaction[0].amount);
    doneName.push(data.data.transaction[0].object.name);
  }
}
async function showUdata() {
  await uIdTime();
  let name = document.getElementById("uname");
  name.innerHTML = `Username: ${uname}`;
  let id = document.getElementById("uid");
  id.innerHTML = `User id: ${uid}`;
  let tim = document.getElementById("time");
  tim.innerHTML = `Last active: ${time}`;
  let pic = document.getElementById("pic");
  pic.src = `${`https://01.kood.tech/git/user/avatar/${uname}/-1`}`;
}
async function showUlvl() {
  let ltxt = document.getElementById("ltxt");
  ltxt.innerHTML = `${xpToLevel(gxp)}
  <p>${Math.round(gxp / 1000)} kB</p>`;
  new Chartist.Pie(
    "#lgraph",
    {
      series: [xpCurLevel(gxp), xpLevelUp(gxp)],
    },
    {
      height: 200,
      width: 200,
      donut: true,
      donutWidth: 20,
      startAngle: 0,
      showLabel: false,
    }
  );
  let nxt = document.getElementById("nxt");
  nxt.innerHTML = `${
    Math.round((xpCurLevel(gxp) / 1000) * 10) / 10
  } / ${
    Math.round(
      ((xpCurLevel(gxp) + xpLevelUp(gxp)) / 1000) * 10
    ) / 10
  } kB <br>
  next level in: ${
    Math.round((xpLevelUp(gxp) / 1000) * 10) / 10
  } kB`;
}
async function showXpPrOt() {
  let tarr = [];
  for (let i = 0; i < times.length; i++) {
    let date = times[i];
    let xp = prxpadded[i];
    let object = { x: new Date(date), y: xp };
    tarr.push(object);
  }
  let parr = [];
  for (let i = 0; i < doneName.length; i++) {
    let name = doneName[i];
    let xp = prxp[i];
    let object = { x: name, y: xp };
    parr.push(object);
  }
  tarr = tarr.sort((a, b) => a.x - b.x);
  let dm = new Date(times[times.length - 1]).getTime() - new Date(times[0]).getTime();
  new Chartist.Bar(
    "#prxp",
    {
      labels: doneName,
      series: [prxp],
    },
    {
      axisY: {
        labelInterpolationFnc: function (value) {
          return Math.round(value / 1000) + " kB";
        },
      },
      axisX: {
        showGrid: false,
      },
    }
  );
  new Chartist.Line(
    "#otxp",
    {
      series: [
        {
          data: tarr,
        },
      ],
    },
    {
      fullWidth: true,
      lineSmooth: Chartist.Interpolation.step({
        fillHoles: true,
      }),
      showPoint: false,
      axisY: {
        labelInterpolationFnc: function (value) {
          return value / 1000 + " kB";
        },
      },
      axisX: {
        type: Chartist.FixedScaleAxis,
        divisor: Math.round((dm / (1000 * 3600 * 24)) / 30) + 1,
        labelInterpolationFnc: function (value) {
          return moment(value).format("D. MMM YYYY");
        },
      },
    }
  );
}
main();
