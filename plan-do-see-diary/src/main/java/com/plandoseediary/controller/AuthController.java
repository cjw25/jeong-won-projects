package com.plandoseediary.controller;

import com.plandoseediary.dto.DeleteAccountForm;
import com.plandoseediary.dto.PasswordChangeForm;
import com.plandoseediary.dto.SignupForm;
import com.plandoseediary.service.AccountService;
import com.plandoseediary.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AccountService accountService;


    @GetMapping("/login")
    public String login(
            String error,
            String logout,
            String signup,
            String passwordChanged,
            String accountDeleted,
            Model model
    ) {

        if (error != null) {

            model.addAttribute(
                    "loginError",
                    "아이디 또는 비밀번호가 올바르지 않습니다."
            );
        }


        if (logout != null) {

            model.addAttribute(
                    "logoutMessage",
                    "로그아웃되었습니다."
            );
        }


        if (signup != null) {

            model.addAttribute(
                    "signupMessage",
                    "회원가입이 완료되었습니다. 로그인해주세요."
            );
        }


        if (passwordChanged != null) {

            model.addAttribute(
                    "passwordChangedMessage",
                    "비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해주세요."
            );
        }


        if (accountDeleted != null) {

            model.addAttribute(
                    "accountDeletedMessage",
                    "계정과 계정에 속한 자료가 삭제되었습니다."
            );
        }


        return "auth/login";
    }


    @GetMapping("/signup")
    public String signupForm(
            Model model
    ) {

        model.addAttribute(
                "signupForm",
                new SignupForm()
        );

        return "auth/signup";
    }


    @PostMapping("/signup")
    public String signup(
            @Valid
            @ModelAttribute("signupForm")
            SignupForm signupForm,

            BindingResult bindingResult,

            Model model
    ) {

        if (bindingResult.hasErrors()) {

            return "auth/signup";
        }


        try {

            authService.signup(
                    signupForm
            );

        } catch (
                IllegalArgumentException e
        ) {

            model.addAttribute(
                    "signupError",
                    e.getMessage()
            );

            return "auth/signup";
        }


        return "redirect:/login?signup";
    }


    @GetMapping("/account/password")
    public String passwordForm(
            Model model
    ) {

        model.addAttribute(
                "passwordChangeForm",
                new PasswordChangeForm()
        );

        return "auth/password";
    }


    @PostMapping("/account/password")
    public String changePassword(
            @Valid
            @ModelAttribute("passwordChangeForm")
            PasswordChangeForm passwordChangeForm,

            BindingResult bindingResult,

            Model model,

            HttpServletRequest request
    ) {

        if (bindingResult.hasErrors()) {

            return "auth/password";
        }


        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        String username =
                authentication.getName();


        try {

            authService.changePassword(
                    username,
                    passwordChangeForm
            );

        } catch (
                IllegalArgumentException e
        ) {

            model.addAttribute(
                    "passwordChangeError",
                    e.getMessage()
            );

            return "auth/password";
        }


        HttpSession session =
                request.getSession(
                        false
                );


        if (session != null) {

            session.invalidate();
        }


        SecurityContextHolder
                .clearContext();


        return "redirect:/login?passwordChanged";
    }


    /*
     * 계정 삭제 확인 화면
     */
    @GetMapping("/account/delete")
    public String deleteAccountForm(
            Model model
    ) {

        model.addAttribute(
                "deleteAccountForm",
                new DeleteAccountForm()
        );

        return "auth/delete-account";
    }


    /*
     * 계정 삭제 처리
     */
    @PostMapping("/account/delete")
    public String deleteAccount(
            @Valid
            @ModelAttribute("deleteAccountForm")
            DeleteAccountForm form,

            BindingResult bindingResult,

            Model model,

            HttpServletRequest request
    ) {

        if (bindingResult.hasErrors()) {

            return "auth/delete-account";
        }


        try {

            accountService.deleteCurrentAccount(
                    form.getPassword()
            );

        } catch (
                IllegalArgumentException e
        ) {

            model.addAttribute(
                    "deleteAccountError",
                    e.getMessage()
            );

            return "auth/delete-account";
        }


        HttpSession session =
                request.getSession(
                        false
                );


        if (session != null) {

            session.invalidate();
        }


        SecurityContextHolder
                .clearContext();


        return "redirect:/login?accountDeleted";
    }
}