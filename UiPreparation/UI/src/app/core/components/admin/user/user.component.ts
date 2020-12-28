import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from "./models/User";
import { UserService } from './Services/User.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { LookUp } from 'app/core/models/LookUp';
import { AlertifyService } from 'app/core/services/Alertify.service';
import { LookUpService } from 'app/core/services/LookUp.service';
import { AuthService } from '../login/Services/Auth.service';
import { environment } from '../../../../../environments/environment'
import { TranslateService } from '@ngx-translate/core';

declare var jQuery: any;

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  @ViewChild('closebutton') closebutton: ElementRef

  user: User;
  userList: User[];
  groupDropdownList: LookUp[];
  groupSelectedItems: LookUp[];
  dropdownSettings: IDropdownSettings;

  claimDropdownList: LookUp[];
  claimSelectedItems: LookUp[];

  isGroupChange: boolean = false;
  isClaimChange: boolean = false;

  userId:number;

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private alertifyService: AlertifyService,
    private lookUpService: LookUpService,
    private authService:AuthService,
    private translateService:TranslateService) { }


  userAddForm: FormGroup;

  ngOnInit() {
    this.getUserList();
    this.createUserAddForm();

    debugger;
    this.translateService.use(localStorage.getItem("lang"));

    this.dropdownSettings = environment.getDropDownSetting;


    this.lookUpService.getGroupLookUp().subscribe(data => {
      this.groupDropdownList = data;
    })

    this.lookUpService.getOperationClaimLookUp().subscribe(data => {
      this.claimDropdownList = data;
    })

  }

  getUserGroupPermissions(userId: number) {

    this.userId=userId;

    this.userService.getUserGroupPermissions(userId).subscribe(data => {
      this.groupSelectedItems = data;
    })
  }

  getUserClaimsPermissions(userId: number) {

    this.userId=userId;

    this.userService.getUserClaims(userId).subscribe(data => {
      this.claimSelectedItems = data;
    })
  }

  saveUserGroupsPermissions(){

    if(this.isGroupChange){

      var ids=this.groupSelectedItems.map(function(x){ return x.id as number});
      this.userService.saveUserGroupPermissions(this.userId, ids).subscribe(x=>{
        jQuery("#groupPermissions").modal("hide");
        this.isGroupChange=false;
        this.alertifyService.success(x);
      },
      error=>{
        this.alertifyService.error(error.error);
        jQuery("#groupPermissions").modal("hide");
      }
      );
      }


  }
  
  saveUserClaimsPermission(){
   
    if(this.isClaimChange){

    var ids=this.claimSelectedItems.map(function(x){ return x.id as number});
    this.userService.saveUserClaims(this.userId, ids).subscribe(x=>{
      jQuery("#claimsPermissions").modal("hide");
      this.isClaimChange=false;
      this.alertifyService.success(x);
    },
    error=>{
      this.alertifyService.error(error.error);
      jQuery("#claimsPermissions").modal("hide");
    });
    }
  }


  onItemSelect(comboType: string) {
    this.setComboStatus(comboType);
  }

  onSelectAll(comboType: string) {
    this.setComboStatus(comboType);
  }
  onItemDeSelect(comboType: string) {
    this.setComboStatus(comboType);
  }

  setComboStatus(comboType: string) {

    if (comboType == "Group")
      this.isGroupChange = true;
    else if (comboType == "Claim")
      this.isClaimChange = true;

  }

  createUserAddForm() {
    this.userAddForm = this.formBuilder.group({
      userId: [0],
      password: ["", Validators.required],
      fullName: ["", Validators.required],
      email: ["", Validators.required],
      address: ["", Validators.required],
      notes: ["", Validators.required],
      status: [true]
    })
  }


  getUserList() {
    this.userService.getUserList().subscribe(data => {
      this.userList = data
    });
  }

  clearFormGroup(group: FormGroup) {

    group.markAsUntouched();
    group.reset();

    Object.keys(group.controls).forEach(key => {
      group.get(key).setErrors(null);
      if (key == "userId")
        group.get(key).setValue(0);
    });
  }



  save() {
    if (this.userAddForm.valid) {
      this.user = Object.assign({}, this.userAddForm.value)

      if (this.user.userId == 0)
        this.addUser();
      else
        this.updateUser();
    }
  }


  addUser() {

    this.userService.addUser(this.user).subscribe(data => {
      this.getUserList();
      this.user = new User();
      jQuery("#user").modal("hide");
      this.alertifyService.success(data);
      this.clearFormGroup(this.userAddForm);

    })
  }

  getUserById(id: number) {
    this.clearFormGroup(this.userAddForm);
    this.userService.getUserById(id).subscribe(data => {
      this.user = data;
      this.userAddForm.patchValue(data);

    })
  }

  updateUser() {

    this.userService.updateUser(this.user).subscribe(data => {

      var index=this.userList.findIndex(x=>x.userId==this.user.userId);
      this.userList[index]=this.user;

      this.user = new User();
      jQuery("#user").modal("hide");
      this.alertifyService.success(data);
      this.clearFormGroup(this.userAddForm);

    })
  }

  deleteUser(id: number) {

    this.userService.deleteUser(id).subscribe(data => {
      debugger;
      this.alertifyService.success(data.toString());
      var index=this.userList.findIndex(x=>x.userId==id);
      this.userList[index].status=false;
    });

  }

  checkClaim(claim:string):boolean{
    return this.authService.claimGuard(claim)
  }

}