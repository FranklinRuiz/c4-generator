import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent {

  dynamicForm!: FormGroup;

  components = [
    'Microservicio',
    'Base de Datos',
    'Servidor',
    'Contenedores'
  ];

  reftList: any = [];

  constructor(
    private matSnackBar: MatSnackBar,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    let initialData: ElementItem[] = this.getInitialDataFromLocalStorage();
    this.buildForm(initialData);
    this.listenForFormChanges();
  }

  getInitialDataFromLocalStorage(): ElementItem[] {
    let storedData = localStorage.getItem('elements');
    let initialData: ElementItem[];

    if (storedData) {
      initialData = JSON.parse(storedData);
      this.updateReftList(initialData);
    } else {
      initialData = [];
    }

    return initialData;
  }

  buildForm(initialData: ElementItem[]) {
    this.dynamicForm = this.fb.group({
      elements: this.fb.array(initialData.map(item => this.fb.group({
        name: [item.name, Validators.required],
        type: [item.type, Validators.required],
        color: [item.color],
        refs: [item.refs],
        text: [item.text]
      })))
    });
  }

  listenForFormChanges() {
    if (this.elements) {
      this.elements.valueChanges.subscribe(val => {
        localStorage.setItem('elements', JSON.stringify(val));
        this.updateReftList(val);
      });
    }
  }

  updateReftList(items: ElementItem[]) {
    this.reftList = [];
    items.forEach(item => {
      if (!!item.name) {
        this.reftList.push(item.name);
      }
    });
  }

  get elements() {
    return this.dynamicForm.get('elements') as FormArray;
  }

  addElement() {
    if (!this.elements.valid) {
      this.elements.markAllAsTouched();
      return;
    }

    this.elements.push(this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      color: [''],
      refs: [''],
      text: ['']
    }));
  }

  deleteElement(index: number) {
    this.elements.removeAt(index);
  }

  onSubmit() {
    const csvData: string = this.dynamicForm.value.elements.reduce((accumulator: string[], item: any) => {
      const rowData: string[] = [
        item.name,
        item.type,
        'default',
        item.color === "" ? '#000000' : item.color,
        item.refs ? item.refs.join(',') : '',
        item.text === undefined ? '' : item.text
      ];
      const rowString: string = rowData.map(value => `"${value}"`).join(',');
      accumulator.push(rowString);
      return accumulator;
    }, []).join('\n');

    this.http.get('assets/draw-script.txt', { responseType: 'text' })
      .subscribe(data => {
        navigator.clipboard.writeText(`${data}${csvData}`).then(() => {
          this.onMessage('Diagrama copiado');
        }).catch(err => {
          console.error('Error al copiar diagrama: ', err);
        });
      });
  }

  onMessage(textMessage: string) {
    this.matSnackBar.open(
      textMessage,
      'Cerrar',
      { duration: 3000, verticalPosition: 'bottom', horizontalPosition: 'center' }
    );
  }

}

interface ElementItem {
  name: string;
  type: string;
  color: string;
  refs: string[];
  text: string;
}