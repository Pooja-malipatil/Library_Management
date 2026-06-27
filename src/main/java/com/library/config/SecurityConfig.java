package com.library.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.library.auth.JwtFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests()
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/api/media").permitAll()
                .antMatchers("/api/media/search").permitAll()
                .antMatchers("/api/media/type/**").permitAll()
                .antMatchers("/api/media/**").hasAuthority("ADMIN")
                .antMatchers("/api/members/**").hasAuthority("ADMIN")
                .antMatchers("/api/transactions/borrow").hasAnyAuthority("ADMIN","MEMBER")
                .antMatchers("/api/transactions/return/**").hasAnyAuthority("ADMIN","MEMBER")
                .antMatchers("/api/transactions/member/**").hasAnyAuthority("ADMIN","MEMBER")
                .antMatchers("/api/transactions/**").hasAuthority("ADMIN")
                .antMatchers("/api/transactions/fines").hasAuthority("ADMIN")
                .antMatchers("/api/transactions/fine/**").hasAnyAuthority("ADMIN","MEMBER")
                .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .cors();
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
