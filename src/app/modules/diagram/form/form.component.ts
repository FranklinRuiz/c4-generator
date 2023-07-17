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
    this.dynamicForm = this.fb.group({
      elements: this.fb.array([])
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
    let isEmpty = (this.elements.length > 0) ? false : true;
    if (!isEmpty) {
      this.reftList = [];
      this.elements.controls.forEach(element => {
        let componentName = element.get('name')?.value;
        if (!!componentName) {
          this.reftList.push(componentName);
        }
      });
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
