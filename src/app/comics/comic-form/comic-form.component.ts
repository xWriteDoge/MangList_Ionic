import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Comic } from '../interfaces/comics';
import { Genres } from '../interfaces/categories';
import { ComicsService } from '../services/comics.service';
import { UsersService } from 'src/app/users/services/users.service';
import { IonicModule } from '@ionic/angular';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';

@Component({
  selector: 'ml-comic-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule,
  ],
  templateUrl: './comic-form.component.html',
  styleUrls: ['./comic-form.component.scss'],
})
export class ComicFormComponent implements OnInit {

  comicForm!: FormGroup;
  titleControl!: FormControl<string>;
  synopsisControl!: FormControl<string>;
  genresControl!: FormControl<string>;
  num_volumesControl!: FormControl<number>;
  statusControl!: FormControl<string>;
  meanControl!: FormControl<number>;

  withID = '';

  newComic: Comic = {
    title: '',
    main_picture: {
      medium: '',
      large: '',
    },
    synopsis: '',
    start_date: (new Date).toLocaleDateString('en-CA'),
    genres: [{ id: 0, name: '' }],
    num_volumes: 0,
    status: '',
    mean: 0,
  };


  constructor(
    private readonly router: Router,
    private readonly fb: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly comicService: ComicsService,
    private readonly userService: UsersService
  ) {}

  ngOnInit(): void {
    this.userService.hasRoleToAdd().subscribe((e) => {
      if (!e) {
        this.router.navigate(['/']);
      }
    });
    this.titleControl = this.fb.control('', [Validators.required]);
    this.synopsisControl = this.fb.control('', [Validators.required]);
    this.genresControl = this.fb.control('', [Validators.required]);
    this.num_volumesControl = this.fb.control(0, [Validators.required]);
    this.statusControl = this.fb.control('');
    this.meanControl = this.fb.control(0, [Validators.required]);
    this.comicForm = this.fb.group({
      title: this.titleControl,
      synopsis: this.synopsisControl,
      genres: this.genresControl,
      num_volumes: this.num_volumesControl,
      status: this.statusControl,
      mean: this.meanControl,
    });

    this.route.queryParams.subscribe((params) => {
      if (params['comicId']) {
        this.comicService.getIdComic(params['comicId']).subscribe({
          next: (res) => {
            this.newComic = res;
            this.withID = params['comicId'];
            let genresComic = '';
            this.newComic.genres!.forEach((e, index) => {
              if (this.newComic.genres!.length - 1 != index)
                genresComic += e.name + ',';
              else genresComic += e.name;
            });
            this.titleControl.setValue(this.newComic.title);
            this.synopsisControl.setValue(this.newComic.synopsis!);
            this.genresControl.setValue(genresComic);
            this.num_volumesControl.setValue(this.newComic.num_volumes!);
            this.statusControl.setValue(this.newComic.status!);
            this.meanControl.setValue(this.newComic.mean!);
          },
          error: (err) => {
            console.error(err);
          },
        });
      }
    });
  }

  addComic() {
    this.newComic.title = this.titleControl.value;
    this.newComic.synopsis = this.synopsisControl.value;
    this.newComic.genres = this.giveGenresArray();
    this.newComic.num_volumes = Number(this.num_volumesControl.value);
    this.newComic.status = this.statusControl.value;
    this.newComic.mean = Number(this.meanControl.value);
    if (this.withID) {
      this.comicService.addComic(this.newComic, this.withID).subscribe({
        next: () => {
          Swal.fire({
            title: 'Comic editado correctamente',
            icon: 'success',
          });
        },
        error: (err) => {
          Swal.fire({
            title: 'Error al editar el comic',
            text: err,
            icon: 'error',
          });
        },
      });
    } else {
      this.comicService.addComic(this.newComic).subscribe({
        next: () => {
          Swal.fire({
            title: 'Comic añadido correctamente',
            icon: 'success',
          });
        },
        error: (err) => {
          Swal.fire({
            title: 'Error al añadir el comic',
            text: err,
            icon: 'error',
          });
        },
      });
    }
  }
  fechaSeleccionada(event:any){
    const fechaSeleccionada = event.detail.value;
    const fechaFormateada = new Date(fechaSeleccionada).toLocaleDateString('en-CA');
    this.newComic.start_date = fechaFormateada
  }

  giveGenresArray(): { id: number; name: string }[] {
    const arrayGenres = this.genresControl.value.split(',');
    const arrayObject: { id: number; name: string }[] = [];
    const genres = Genres;

    for (let i = 0; i < arrayGenres.length; i++) {
      genres.forEach((element) => {
        if (
          element.name.toLocaleLowerCase() ===
            arrayGenres[i].trim().toLocaleLowerCase() ||
          element.value.toLocaleLowerCase() ===
            arrayGenres[i].trim().toLocaleLowerCase()
        )
          arrayObject.push({ id: i, name: element.value });
      });
    }
    return arrayObject;
  }

  resetForm() {
    this.comicForm.reset();
    this.newComic.main_picture.medium = '';
    this.newComic.main_picture.large = '';
  }

  async takePhoto() {
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      quality: 90,
      height: 640,
      width: 640,
      resultType: CameraResultType.DataUrl,
    });

    this.newComic.main_picture.large = photo.dataUrl as string;
    this.newComic.main_picture.medium = photo.dataUrl as string;
  }

  async pickFromGallery() {
    const photo = await Camera.getPhoto({
      source: CameraSource.Photos,
      height: 640,
      width: 640,

      resultType: CameraResultType.DataUrl,
    });

    this.newComic.main_picture.large = photo.dataUrl as string;
    this.newComic.main_picture.medium = photo.dataUrl as string;
  }
}
