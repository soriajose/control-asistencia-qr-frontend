import {ChangeDetectionStrategy, Component} from '@angular/core';
import {Employee} from './app/services/attendance.service';
import {RouterOutlet} from "@angular/router";

export type LoggedInUser = { role: 'admin' } | { role: 'employee'; data: Employee };

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet
    ],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

}
