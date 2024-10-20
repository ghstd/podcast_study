import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.11.0/firebase-app.js'
import { getDatabase, ref, child, get } from "https://www.gstatic.com/firebasejs/9.11.0/firebase-database.js"
import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.esm.browser.min.js'
import hljs from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.6.0/build/es/highlight.min.js'

const app = initializeApp(firebaseConfig);

getData()
	.then(data => {
		render(data)
		hljs.highlightAll()
	})

function render(options) {
	const root = document.querySelector('.themes');
	const themes = Object.keys(options ?? {});

	themes.sort((str1, str2) => {

		if (parseInt(str1) === parseInt(str2)) {
			str1 = str1.replace(/[-\s]/g, '')
			str2 = str2.replace(/[-\s]/g, '')
			return parseInt(str1) - parseInt(str2)
		} else {
			return parseInt(str1) - parseInt(str2)
		}
	})

	root.innerHTML = `
		<li class="thema">
			<h2 class="thema-title">добавить тему</h2>
		</li>
	`
	root.querySelector('.thema-title').addEventListener('click', addForm)

	themes.forEach(thema => {
		const theses = (options[thema].theses ?? []).map(thesis => thesis.replace(/\\n/g, '\n').replace(/.+(?=\n)|.+(?=$)/g, '<p>$&</p>').replace(/\n/g, ''))
			.map(thesis => `<li class="thesis">${thesis}</li>`).join('');

		const examples = (options[thema].examples ?? []).map(example => {

			if (/(\.png|\.jpg|\.jpeg)/.test(example.example)) {
				return `
				<div class="swiper-slide example">
					<h3 class="example-title">${example.title}</h3>
					<img src=${example.example} alt=${example.title}>
				</div>
				`
			} else {
				return `
				<div class="swiper-slide example">
					<h3 class="example-title">${example.title}</h3>
					<pre><code class="language-javascript">${example.example.replace(/\t/g, '&nbsp;&nbsp;')}</code></pre>
				</div>
				`
			}

		}).join('');

		const links = (options[thema].links ?? []).map(link => `
		<li class="link"><a href="${link}" target="_blank">${link}</a></li>
		`).join('');

		const html = `
			<li class="thema" data-thema="${thema}">
				<h2 class="thema-title">${thema}</h2>
				<button class="edit-btn"></button>
				<button class="delete-btn"></button>
				<div class="thema-body">
					<ol class="theses">${theses}</ol>
					<div class="examples">
						<div class="swiper">
							<div class="swiper-wrapper">${examples}</div>
							<div class="swiper-pagination"></div>
						</div>
						<div class="swiper-button-prev"></div>
						<div class="swiper-button-next"></div>
					</div>
					<ul class="links">${links}</ul>
				</div>
			</li>
		`;

		root.insertAdjacentHTML('beforeend', html)

		const themaTitleButton = root.querySelector(`[data-thema="${thema}"] .thema-title`);

		themaTitleButton.addEventListener('click', (e) => {
			if (e.target.closest(`[data-thema="${thema}"]`).classList.contains('active')) {
				e.target.closest(`[data-thema="${thema}"]`).classList.remove('active')
			} else {
				document.querySelector('#form')?.remove()
				document.querySelectorAll('.thema-body').forEach(body => body.classList.remove('active'))
				document.querySelectorAll('.edit-btn').forEach(btn => btn.classList.remove('active'))
				document.querySelectorAll('.thema').forEach(thema => thema.classList.remove('active'))
				root.querySelector(`[data-thema="${thema}"]`).classList.add('active')
			}

			if (root.querySelector(`[data-thema="${thema}"]`).lastElementChild.matches('#form')) {
				editButton.click()
			}
		})

		const editButton = root.querySelector(`[data-thema="${thema}"] .edit-btn`);

		editButton.addEventListener('click', addForm)

		const deleteButton = root.querySelector(`[data-thema="${thema}"] .delete-btn`);

		deleteButton.addEventListener('click', () => {
			deleteData(thema)
				.then(() => getData())
				.then(data => {
					render(data)
					hljs.highlightAll()
				})
		})

		const swiper = new Swiper(`[data-thema="${thema}"] .swiper`, {
			pagination: {
				el: `[data-thema="${thema}"] .swiper-pagination`,
			},
			navigation: {
				nextEl: `[data-thema="${thema}"] .swiper-button-next`,
				prevEl: `[data-thema="${thema}"] .swiper-button-prev`,
			},
			allowTouchMove: false
		});
	})
}

function addForm() {
	document.querySelector('#form')?.remove()

	const button = this;
	const parent = button.closest('.thema');
	const thema = parent.dataset.thema

	button.classList.toggle('active')

	if (button.classList.contains('active')) {
		const form = document.createElement('form');

		form.setAttribute('id', 'form')
		form.innerHTML = `
			<input id="thema" type="text" placeholder="thema (необходимо заполнить)">
			<textarea id="theses" placeholder="theses (используйте пустую строку для разделения на пункты)"></textarea>
			<div id="examples">
				<button id="add-example" type="button">add example</button>
			</div>
			<textarea id="links" placeholder="links"></textarea>
			<button id="submit" type="submit">submit</button>
		`

		const addExampleButton = form.querySelector('#add-example');

		form.addEventListener('submit', (e) => {
			e.preventDefault()
			submitForm(thema)
		})

		addExampleButton.addEventListener('click', () => {
			addExampleButton.insertAdjacentHTML('beforebegin', `
				<input id="example-title" placeholder="title">
				<textarea id="example" placeholder="example"></textarea>
			`)
		})

		if (!thema) {
			parent.append(form)
		} else {
			getData(thema)
				.then(data => {
					form.querySelector('#thema').value = thema
					form.querySelector('#theses').value = (data.theses ?? []).join('\n\n');
					form.querySelector('#links').value = (data.links ?? []).join('\n\n');
					(data.examples ?? []).forEach((example, index) => {
						addExampleButton.insertAdjacentHTML('beforebegin', `
							<input id="example-title" placeholder="title">
							<textarea id="example" placeholder="example"></textarea>
						`)
						form.querySelectorAll('#example-title')[index].value = example.title
						form.querySelectorAll('#example')[index].value = example.example
					})

					parent.querySelector('.thema-body').classList.add('active')
					parent.append(form)
				})
		}
	} else {
		if (thema) {
			parent.querySelector('.thema-body').classList.remove('active')
		}
	}
}

function submitForm(oldThema) {
	const form = document.querySelector('#form');
	const thema = form.querySelector('#thema');
	const theses = form.querySelector('#theses');
	const links = form.querySelector('#links');

	if (!thema.value) return

	const name = thema.value.replace(/[\.\/]/g, ' - ');
	const data = {
		theses: [''],
		examples: [],
		links: []
	};

	if (theses.value) {
		const result = theses.value.match(/(.\s?)+(\n{2,}|$)/g).map(item => item.replace(/\n{2,}/g, '\n'));

		data.theses = result
	}

	const examplesTitles = document.querySelectorAll('#example-title');
	const examples = document.querySelectorAll('#example');

	examples.forEach((example, index) => {

		if (!example.value) return

		const result = {
			title: examplesTitles[index].value ? examplesTitles[index].value : `example #${index + 1}`,
			example: example.value
		};

		examplesTitles[index].remove()
		example.remove()
		data.examples.push(result)
	})

	if (/http/i.test(links.value)) {
		const result = links.value.replace(/["']/g, '').match(/http.+?((?=http)|(?=\s)|(?=\n)|(?=$))/ig);

		data.links = result
	}

	thema.value = ''
	theses.value = ''
	links.value = ''

	if (oldThema && oldThema !== thema) {
		deleteData(oldThema)
			.then(() => patchData(name, JSON.stringify(data)))
			.then(() => getData())
			.then(data => {
				render(data)
				hljs.highlightAll()
			})
	} else {
		patchData(name, JSON.stringify(data))
			.then(() => getData())
			.then(data => {
				render(data)
				hljs.highlightAll()
			})
	}
}

async function getData(name = '') {
	const res = await fetch(`https://podcast-study-proj-default-rtdb.europe-west1.firebasedatabase.app/${name}/.json`);
	return await res.json()
}

async function patchData(name, data) {
	const response = await fetch(`https://podcast-study-proj-default-rtdb.europe-west1.firebasedatabase.app/${name}/.json`, {
		method: 'PATCH',
		body: data
	});

	if (response.ok) {
		alert('Данные успешно записаны.');
	} else {
		alert('Запрещено редактирование данных. Проверьте права доступа.');
	}
}

async function deleteData(name) {
	const response = await fetch(`https://podcast-study-proj-default-rtdb.europe-west1.firebasedatabase.app/${name}/.json`, {
		method: 'DELETE'
	});

	if (response.ok) {
		alert('Данные успешно удалены.');
	} else {
		alert('Запрещено редактирование данных. Проверьте права доступа.');
	}
}




