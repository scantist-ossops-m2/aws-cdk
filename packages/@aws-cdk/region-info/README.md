# AWS Region-Specific Information Directory
<!--BEGIN STABILITY BANNER-->

---

![End-of-Support](https://img.shields.io/badge/End--of--Support-critical.svg?style=for-the-badge)

> AWS CDK v1 has reached End-of-Support on 2023-06-01.
> This package is no longer being updated, and users should migrate to AWS CDK v2.
>
> For more information on how to migrate, see the [_Migrating to AWS CDK v2_ guide][doc].
>
> [doc]: https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html

---

<!--END STABILITY BANNER-->

## Usage

Some information used in CDK Applications differs from one AWS region to
another, such as service principals used in IAM policies, S3 static website
endpoints, ...

### The `RegionInfo` class

The library offers a simple interface to obtain region specific information in
the form of the `RegionInfo` class. This is the preferred way to interact with
the regional information database:

```ts
// Get the information for "eu-west-1":
const region = regionInfo.RegionInfo.get('eu-west-1');

// Access attributes:
region.s3StaticWebsiteEndpoint; // s3-website-eu-west-1.amazonaws.com
region.servicePrincipal('logs.amazonaws.com'); // logs.eu-west-1.amazonaws.com
```

The `RegionInfo` layer is built on top of the Low-Level API, which is described
below and can be used to register additional data, including user-defined facts
that are not available through the `RegionInfo` interface.

### Low-Level API

This library offers a primitive database of such information so that CDK
constructs can easily access regional information. The `FactName` class provides
a list of known fact names, which can then be used with the `RegionInfo` to
retrieve a particular value:

```ts
const codeDeployPrincipal = regionInfo.Fact.find('us-east-1', regionInfo.FactName.servicePrincipal('codedeploy.amazonaws.com'));
// => codedeploy.us-east-1.amazonaws.com

const staticWebsite = regionInfo.Fact.find('ap-northeast-1', regionInfo.FactName.S3_STATIC_WEBSITE_ENDPOINT);
// => s3-website-ap-northeast-1.amazonaws.com
```

## Supplying new or missing information

As new regions are released, it might happen that a particular fact you need is
missing from the library. In such cases, the `Fact.register` method can be used
to inject FactName into the database:

```ts
class MyFact implements regionInfo.IFact {
  public readonly region = 'bermuda-triangle-1';
  public readonly name = regionInfo.FactName.servicePrincipal('s3.amazonaws.com');
  public readonly value = 's3-website.bermuda-triangle-1.nowhere.com';
}

regionInfo.Fact.register(new MyFact());
```

## Overriding incorrect information

In the event information provided by the library is incorrect, it can be
overridden using the same `Fact.register` method demonstrated above, simply
adding an extra boolean argument:

```ts
class MyFact implements regionInfo.IFact {
  public readonly region = 'us-east-1';
  public readonly name = regionInfo.FactName.servicePrincipal('service.amazonaws.com');
  public readonly value = 'the-correct-principal.amazonaws.com';
}

regionInfo.Fact.register(new MyFact(), true /* Allow overriding information */);
```

If you happen to have stumbled upon incorrect data built into this library, it
is always a good idea to report your findings in a [GitHub issue], so we can fix
it for everyone else!

[GitHub issue]: https://github.com/aws/aws-cdk/issues

---

This module is part of the [AWS Cloud Development Kit](https://github.com/aws/aws-cdk) project.