import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// FIREBASE CONFIGURATION
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyDpVgUg4K56bx79o4BjxGdTqWmScs9e1Bc",
  authDomain: "cac-kids.firebaseapp.com",
  projectId: "cac-kids",
  storageBucket: "cac-kids.firebasestorage.app",
  messagingSenderId: "815034768217",
  appId: "1:815034768217:web:f22bf3a84334b40f9fca48"
};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


// ======================================================
// APP SETTINGS
// ======================================================

const ADMIN = {
  id: "cac-admin",
  fullName: "CAC Administrator",
  email: "cackids@gmail.com"
};

const $ = selector => document.querySelector(selector);
const app = $("#app");

const esc = value =>
  String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[character]));

const name = child =>
  [child.firstName, child.middleName, child.lastName]
    .filter(Boolean)
    .join(" ");


// ======================================================
// TOAST
// ======================================================

function toast(message) {
  const element = document.createElement("div");

  element.className = "toast";
  element.textContent = message;

  $("#toast-root").append(element);

  setTimeout(() => element.remove(), 3000);
}


// ======================================================
// NAVIGATION
// ======================================================

const go = path => {
  history.pushState({}, "", path);
  render();
};


// ======================================================
// AUTHENTICATION
// ======================================================

function user() {
  return auth.currentUser
    ? ADMIN
    : null;
}


// ======================================================
// AUTH SCREEN
// ======================================================

function authScreen(body) {

  app.innerHTML = `
    <main class="auth-page">

      <section class="auth-hero">

        <div class="brand">
          <span class="brand-mark">✦</span>
          CAC
        </div>

        <div>
          <h1>Child records, made effortless.</h1>

          <p>
            A secure workspace for administrators
            to manage the CAC list of children.
          </p>
        </div>

        <div class="security-note">
          ● Protected administrator access
        </div>

      </section>

      <section class="auth-panel">

        <div class="form-shell">
          ${body}
        </div>

      </section>

    </main>
  `;
}


// ======================================================
// LOGIN
// ======================================================

function login() {

  authScreen(`

    <span class="eyebrow">
      Administrator access
    </span>

    <h2>Welcome back</h2>

    <p>
      Sign in to access the CAC list of children.
    </p>

    <form id="login-form" class="form-grid">

      <div class="field">

        <label>
          Admin email address
        </label>

        <input
          name="email"
          type="email"
          autocomplete="email"
          required
        >

      </div>


      <div class="field">

        <label>
          Password
        </label>

        <input
          name="password"
          type="password"
          autocomplete="current-password"
          required
        >

      </div>


      <span class="error" id="login-error"></span>


      <button class="button primary full">
        Sign in securely
      </button>

    </form>

  `);


  $("#login-form").onsubmit = async event => {

    event.preventDefault();

    const data =
      Object.fromEntries(
        new FormData(event.target)
      );

    const errorElement = $("#login-error");

    errorElement.textContent = "";


    try {

      await signInWithEmailAndPassword(
        auth,
        data.email.trim().toLowerCase(),
        data.password
      );

      toast("Login successful.");

      go("/admin/dashboard");

    } catch (error) {

      console.error(error);

      errorElement.textContent =
        "Invalid administrator email or password.";

    }

  };

}


// ======================================================
// LAYOUT
// ======================================================

function layout(title, body) {

  const admin = user();

  if (!admin) {
    return login();
  }


  app.innerHTML = `

    <div class="app-shell">

      <aside class="sidebar">

        <div class="brand">

          <span class="brand-mark">✦</span>
          CAC

        </div>


        <nav class="nav">

          <button
            class="${location.pathname === "/admin/dashboard" ? "active" : ""}"
            onclick="go('/admin/dashboard')"
          >
            ▦ Dashboard
          </button>


          <button
            class="${location.pathname === "/admin/children" ? "active" : ""}"
            onclick="go('/admin/children')"
          >
            ♙ List of Children
          </button>


          <button
            onclick="go('/admin/children/add')"
          >
            ＋ Add Child
          </button>

        </nav>


        <div class="sidebar-bottom">

          <button
            class="nav"
            onclick="logout()"
          >
            ↪ Logout
          </button>

        </div>

      </aside>


      <section class="content">

        <header class="topbar">

          <div class="page-title">
            ${title}
          </div>


          <div class="admin-menu">

            <div class="avatar">
              ${esc(admin.fullName[0]).toUpperCase()}
            </div>

            <div>

              <div class="admin-name">
                ${esc(admin.fullName)}
              </div>

              <div class="admin-role">
                Administrator
              </div>

            </div>

          </div>

        </header>


        <main class="main">

          ${body}

        </main>

      </section>

    </div>

  `;
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

  await signOut(auth);

  go("/admin/login");

}


// ======================================================
// GET ALL CHILDREN
// ======================================================

async function getChildren() {

  const childrenReference =
    collection(db, "children");

  const childrenQuery =
    query(
      childrenReference,
      orderBy("createdAt", "desc")
    );

  const snapshot =
    await getDocs(childrenQuery);

  return snapshot.docs.map(document => ({
    id: document.id,
    ...document.data()
  }));

}


// ======================================================
// TABLE
// ======================================================

function table(list) {

  if (!list.length) {

    return `

      <div class="empty">

        <strong>
          No children found
        </strong>

        <p>
          Add the first child to start the CAC list.
        </p>

      </div>

    `;

  }


  return `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>No.</th>
            <th>First Name</th>
            <th>Middle Name</th>
            <th>Last Name</th>
            <th>Age</th>
            <th>Location</th>
            <th class="no-print">Actions</th>

          </tr>

        </thead>


        <tbody>

          ${list.map((child, index) => `

            <tr>

              <td class="list-number">
                ${index + 1}
              </td>

              <td>
                ${esc(child.firstName)}
              </td>

              <td>
                ${esc(child.middleName || "—")}
              </td>

              <td>
                ${esc(child.lastName)}
              </td>

              <td>
                ${esc(child.age)}
              </td>

              <td>
                ${esc(child.location)}
              </td>

              <td class="actions no-print">

                <button
                  class="icon-button"
                  onclick="go('/admin/children/${child.id}')"
                >
                  View
                </button>


                <button
                  class="icon-button"
                  onclick="go('/admin/children/${child.id}/edit')"
                >
                  Edit
                </button>


                <button
                  class="icon-button delete"
                  onclick="removeChild('${child.id}')"
                >
                  Delete
                </button>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

  `;

}


// ======================================================
// DASHBOARD
// ======================================================

async function dashboard() {

  try {

    const children =
      await getChildren();


    const locations =
      new Set(
        children
          .map(child => child.location)
          .filter(Boolean)
      );


    layout(
      "Dashboard",

      `

        <section class="welcome-hero">

          <div class="welcome-copy">

            <span class="eyebrow">
              CAC CHILDREN'S PROGRAM
            </span>

            <h1>
              A warm welcome to the CAC community.
            </h1>

            <p>
              Keeping every child record organized,
              accessible, and cared for.
            </p>

            <button
              class="button primary"
              onclick="go('/admin/children/add')"
            >
              Add a child
            </button>

          </div>


          <div
            class="welcome-image"
            role="img"
            aria-label="Children gathering together outdoors"
          ></div>

        </section>


        <div class="metrics">

          <div class="metric">

            <small>
              Total Children
            </small>

            <strong>
              ${children.length}
            </strong>

            <span class="trend">
              CAC child list
            </span>

          </div>


          <div class="metric">

            <small>
              Locations
            </small>

            <strong>
              ${locations.size}
            </strong>

            <span class="trend">
              Recorded locations
            </span>

          </div>


          <div class="metric">

            <small>
              Recently Added
            </small>

            <strong>
              ${Math.min(children.length, 5)}
            </strong>

            <span class="trend">
              Latest five records
            </span>

          </div>

        </div>


        <section class="card">

          <div class="section-head">

            <div>

              <h2>
                Recently Added Children
              </h2>

              <p>
                Your five most recently added child records.
              </p>

            </div>


            <button
              class="button secondary"
              onclick="go('/admin/children')"
            >
              View full list
            </button>

          </div>


          ${table(children.slice(0, 5))}

        </section>

      `
    );

  } catch (error) {

    console.error(error);

    toast(
      "Unable to load children from Firebase."
    );

  }

}


// ======================================================
// CHILDREN LIST
// ======================================================

async function list() {

  layout(
    "CAC List of Children",

    `

      <section class="card list-card">

        <div class="section-head">

          <div>

            <span class="eyebrow">
              CAC DIRECTORY
            </span>

            <h2>
              List of Children
            </h2>

            <p>
              First name, middle name, last name,
              age, and location.
            </p>

          </div>


          <div class="section-actions no-print">

            <button
              class="button secondary"
              onclick="printList()"
            >
              Print List
            </button>


            <button
              class="button primary"
              onclick="go('/admin/children/add')"
            >
              + Add Child
            </button>

          </div>

        </div>


        <div class="table-tools no-print">

          <div class="search">

            <input
              id="search"
              class="control"
              placeholder="Search by name or location"
            >

          </div>

        </div>


        <div id="results">

          <p>
            Loading children...
          </p>

        </div>

      </section>

    `
  );


  try {

    const children =
      await getChildren();


    const refresh = () => {

      const queryText =
        $("#search")
          .value
          .toLowerCase()
          .trim();


      const filtered =
        children.filter(child =>
          [
            child.firstName,
            child.middleName,
            child.lastName,
            child.location
          ]
            .join(" ")
            .toLowerCase()
            .includes(queryText)
        );


      $("#results").innerHTML =

        table(filtered) +

        `

          <div class="pagination no-print">

            <span>
              ${filtered.length}
              child${filtered.length === 1 ? "" : "ren"}
            </span>

            <span>
              Page 1 of 1
            </span>

          </div>

        `;

    };


    $("#search").oninput = refresh;

    refresh();

  } catch (error) {

    console.error(error);

    $("#results").innerHTML = `

      <div class="empty">

        <strong>
          Unable to load children
        </strong>

        <p>
          Please check your Firebase configuration
          and Firestore rules.
        </p>

      </div>

    `;

  }

}


// ======================================================
// ADD / EDIT FORM
// ======================================================

async function form(existingChild = null) {

  const old = existingChild;

  const child =
    old || {};


  layout(

    old
      ? "Edit Child"
      : "Add Child",

    `

      <section class="card form-card">

        <h2>
          ${
            old
              ? "Update child details"
              : "Add a child to the CAC list"
          }
        </h2>


        <p>
          Enter the child's name, age, and location.
        </p>


        <form
          id="child-form"
          class="member-form"
        >


          <div class="field">

            <label>
              First name *
            </label>

            <input
              name="firstName"
              value="${esc(child.firstName || "")}"
              required
            >

          </div>


          <div class="field">

            <label>
              Middle name
            </label>

            <input
              name="middleName"
              value="${esc(child.middleName || "")}"
            >

          </div>


          <div class="field">

            <label>
              Last name *
            </label>

            <input
              name="lastName"
              value="${esc(child.lastName || "")}"
              required
            >

          </div>


          <div class="field">

            <label>
              Age *
            </label>

            <input
              name="age"
              type="number"
              min="0"
              max="120"
              value="${esc(child.age || "")}"
              required
            >

          </div>


          <div class="field wide">

            <label>
              Location *
            </label>

            <input
              name="location"
              value="${esc(child.location || "")}"
              required
            >

          </div>


          <div class="wide form-actions">

            <button
              type="button"
              class="button secondary"
              onclick="go('/admin/children')"
            >
              Cancel
            </button>


            <button
              class="button primary"
            >
              ${
                old
                  ? "Save changes"
                  : "Add child"
              }
            </button>

          </div>


        </form>

      </section>

    `
  );


  $("#child-form").onsubmit =
    async event => {

      event.preventDefault();


      const data =
        Object.fromEntries(
          new FormData(event.target)
        );


      if (+data.age > 120) {

        return toast(
          "Age must be from 0 to 120."
        );

      }


      try {

        if (old) {

          const childReference =
            doc(
              db,
              "children",
              old.id
            );


          await updateDoc(
            childReference,
            {
              firstName: data.firstName,
              middleName: data.middleName,
              lastName: data.lastName,
              age: Number(data.age),
              location: data.location,
              updatedAt: new Date()
            }
          );


          toast(
            "Child record updated."
          );

        } else {

          await addDoc(
            collection(db, "children"),
            {
              firstName: data.firstName,
              middleName: data.middleName,
              lastName: data.lastName,
              age: Number(data.age),
              location: data.location,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          );


          toast(
            "Child record added."
          );

        }


        go("/admin/children");

      } catch (error) {

        console.error(error);

        toast(
          "Unable to save child record."
        );

      }

    };

}


// ======================================================
// CHILD DETAIL
// ======================================================

async function detail(id) {

  try {

    const reference =
      doc(db, "children", id);

    const snapshot =
      await getDoc(reference);


    if (!snapshot.exists()) {

      return go("/admin/children");

    }


    const child = {
      id: snapshot.id,
      ...snapshot.data()
    };


    layout(

      "Child Record",

      `

        <section class="card">

          <div class="section-head">

            <div>

              <h2>
                ${esc(name(child))}
              </h2>

              <p>
                Child ID: ${esc(child.id)}
              </p>

            </div>


            <button
              class="button secondary"
              onclick="go('/admin/children/${child.id}/edit')"
            >
              Edit child
            </button>

          </div>


          <div class="detail-grid">


            <div>

              <label>
                First name
              </label>

              <strong>
                ${esc(child.firstName)}
              </strong>

            </div>


            <div>

              <label>
                Middle name
              </label>

              <strong>
                ${esc(child.middleName || "—")}
              </strong>

            </div>


            <div>

              <label>
                Last name
              </label>

              <strong>
                ${esc(child.lastName)}
              </strong>

            </div>


            <div>

              <label>
                Age
              </label>

              <strong>
                ${esc(child.age)}
              </strong>

            </div>


            <div>

              <label>
                Location
              </label>

              <strong>
                ${esc(child.location)}
              </strong>

            </div>


          </div>

        </section>

      `
    );

  } catch (error) {

    console.error(error);

    toast(
      "Unable to load child record."
    );

  }

}


// ======================================================
// DELETE CONFIRMATION
// ======================================================

function removeChild(id) {

  $("#delete-modal")?.remove();


  document.body.insertAdjacentHTML(

    "beforeend",

    `

      <div
        class="modal-backdrop"
        id="delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
      >

        <div class="modal">

          <h3 id="delete-title">
            Delete child record?
          </h3>

          <p>
            Are you sure you want to delete this child?
          </p>


          <div class="modal-actions">

            <button
              class="button secondary"
              id="cancel-delete"
            >
              Cancel
            </button>


            <button
              class="button"
              id="confirm-delete"
              style="background:#c55347;color:#fff"
            >
              Delete
            </button>

          </div>

        </div>

      </div>

    `
  );


  $("#cancel-delete").onclick =
    () => $("#delete-modal").remove();


  $("#confirm-delete").onclick =
    () => deleteChild(id);

}


// ======================================================
// DELETE FROM FIRESTORE
// ======================================================

async function deleteChild(id) {

  try {

    await deleteDoc(
      doc(db, "children", id)
    );


    $("#delete-modal")?.remove();

    toast(
      "Child record deleted."
    );

    go("/admin/children");

  } catch (error) {

    console.error(error);

    toast(
      "Unable to delete child record."
    );

  }

}


// ======================================================
// PRINT
// ======================================================

function printList() {

  const date =
    new Date().toLocaleDateString(
      "en-US",
      {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );


  let header =
    $("#print-date");


  if (!header) {

    header =
      document.createElement("div");

    header.id =
      "print-date";

    header.className =
      "print-header";

    $(".list-card")
      .prepend(header);

  }


  header.innerHTML = `

    <strong>
      CAC List of Children
    </strong>

    <span>
      Date: ${date}
    </span>

  `;


  document.title =
    "CAC List of Children";


  window.print();

}


// ======================================================
// MOBILE NAVIGATION
// ======================================================

const mobileNavigation =
  new MutationObserver(() => {

    const content =
      $(".content");


    if (
      !content ||
      $(".mobile-nav")
    ) {
      return;
    }


    const nav =
      document.createElement("nav");


    nav.className =
      "mobile-nav";


    nav.setAttribute(
      "aria-label",
      "Mobile navigation"
    );


    nav.innerHTML = `

      <button data-route="/admin/dashboard">
        Home
      </button>

      <button data-route="/admin/children">
        Children
      </button>

      <button data-route="/admin/children/add">
        Add Child
      </button>

    `;


    nav
      .querySelectorAll("button")
      .forEach(button => {

        button.onclick =
          () => go(button.dataset.route);

      });


    content.insertBefore(
      nav,
      $(".main")
    );

  });


mobileNavigation.observe(
  app,
  {
    childList: true,
    subtree: true
  }
);


// ======================================================
// UPPERCASE NAMES
// ======================================================

document.addEventListener(
  "input",
  event => {

    if (
      event.target.matches(
        'input[name="firstName"], input[name="middleName"], input[name="lastName"]'
      )
    ) {

      event.target.value =
        event.target.value.toUpperCase();

    }

  }
);


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

Object.assign(
  window,
  {
    go,
    removeChild,
    deleteChild,
    printList,
    logout
  }
);


// ======================================================
// ROUTER
// ======================================================

async function render() {

  const path =
    location.pathname;


  if (
    [
      "/admin/dashboard",
      "/admin/children"
    ].includes(path) ||
    path.startsWith("/admin/children/")
  ) {

    if (!user()) {

      return go("/admin/login");

    }

  }


  if (
    path === "/admin/login" ||
    path === "/admin/register"
  ) {

    if (user()) {

      return go("/admin/dashboard");

    }

    return login();

  }


  if (
    path === "/admin/dashboard"
  ) {

    return dashboard();

  }


  if (
    path === "/admin/children"
  ) {

    return list();

  }


  if (
    path === "/admin/children/add"
  ) {

    return form();

  }


  const match =
    path.match(
      /^\/admin\/children\/([^/]+)(\/edit)?$/
    );


  if (match) {

    const id =
      match[1];


    if (match[2]) {

      try {

        const snapshot =
          await getDoc(
            doc(
              db,
              "children",
              id
            )
          );


        if (!snapshot.exists()) {

          return go("/admin/children");

        }


        return form({
          id: snapshot.id,
          ...snapshot.data()
        });

      } catch (error) {

        console.error(error);

        return toast(
          "Unable to load child record."
        );

      }

    }


    return detail(id);

  }


  return login();

}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
  auth,
  currentUser => {

    render();

  }
);


// ======================================================
// START
// ======================================================

window.onpopstate =
  render;

render();
